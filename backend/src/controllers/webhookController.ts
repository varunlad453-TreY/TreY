import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class WebhookController {
  constructor() {
  }

  /**
   * Links a TreY obligation to a third-party reference (e.g., Jira Ticket)
   */
  createLink = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      console.log('[Webhooks] createLink called with body:', req.body);
      const { obligation_id, integration_type, external_reference_id } = req.body;
      const authReq = req as any; 
      const organizationId = authReq.user?.organization_id || authReq.user?.organizationId;
      const userId = authReq.user?.id;
      console.log('[Webhooks] Parsed user context:', { organizationId, userId });

      if (!obligation_id || !integration_type || !external_reference_id) {
        console.log('[Webhooks] Missing parameters');
        res.status(400).json({ success: false, message: 'Missing required link parameters' });
        return;
      }

      if (!organizationId || !userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const normalizedIntegrationType = String(integration_type).trim().toLowerCase();
      if (!['jira', 'slack'].includes(normalizedIntegrationType)) {
        res.status(400).json({ success: false, message: 'Unsupported integration type. Use jira or slack.' });
        return;
      }

      const normalizedReferenceId = normalizedIntegrationType === 'jira'
        ? String(external_reference_id).trim().toUpperCase()
        : String(external_reference_id).trim();

      const metadata: Record<string, string> = {};
      const jiraBaseUrl = process.env.JIRA_BASE_URL?.trim();
      if (normalizedIntegrationType === 'jira' && jiraBaseUrl) {
        metadata.link_url = `${jiraBaseUrl.replace(/\/+$/, '')}/browse/${encodeURIComponent(normalizedReferenceId)}`;
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        console.log('[Webhooks] Executing integration_links insertion');
        const linkResult = await client.query(
          `INSERT INTO integration_links (organization_id, obligation_id, integration_type, external_reference_id, metadata)
           VALUES ($1, $2, $3, $4, $5::jsonb)
           ON CONFLICT (integration_type, external_reference_id)
           DO UPDATE
             SET obligation_id = EXCLUDED.obligation_id,
                 organization_id = EXCLUDED.organization_id,
                 metadata = COALESCE(integration_links.metadata, '{}'::jsonb) || EXCLUDED.metadata,
                 updated_at = CURRENT_TIMESTAMP
           WHERE integration_links.organization_id = EXCLUDED.organization_id
           RETURNING id, organization_id, obligation_id, integration_type, external_reference_id, metadata, created_at, updated_at`,
          [organizationId, obligation_id, normalizedIntegrationType, normalizedReferenceId, JSON.stringify(metadata)]
        );

        if (linkResult.rows.length === 0) {
          await client.query('ROLLBACK');
          res.status(409).json({
            success: false,
            message: 'Reference ID already linked in another organization. Use a unique external reference.'
          });
          return;
        }

        console.log('[Webhooks] Executing audit_logs insertion');
        await client.query(
          `INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, new_value, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            'obligation',
            obligation_id,
            'INTEGRATION_LINKED',
            userId,
            { integration_type: normalizedIntegrationType, external_reference_id: normalizedReferenceId },
            'WebhookController'
          ]
        );

        await client.query('COMMIT');
        console.log('[Webhooks] Successfully linked');
        res.status(201).json({
          success: true,
          message: `Successfully linked Obligation to ${normalizedIntegrationType}: ${normalizedReferenceId}`,
          data: { link: linkResult.rows[0] }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[Webhooks link Error]:', error);
      res.status(500).json({ success: false, message: 'Internal server error while linking integration' });
    }
  };

  /**
   * Captures Jira webhooks. 
   * When a Jira ticket is moved to "Done", it finds the linked Obligation,
   * attaches "shadow evidence" to it, marks it as complete, and logs it.
   */
  handleJiraWebhook = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const payload = req.body;
      // Security constraint: Check Jira Webhook secret
      const jiraSecret = process.env.JIRA_WEBHOOK_SECRET;
      // In production, validate HMAC signature if provided by Jira
      // For now we check a simple query param or header token
      const headerToken = req.headers['x-jira-signature'];
      const token = Array.isArray(headerToken)
        ? headerToken[0]
        : (typeof headerToken === 'string' ? headerToken : (typeof req.query.token === 'string' ? req.query.token : undefined));
      if (jiraSecret && token !== jiraSecret) {
        res.status(401).json({ success: false, message: 'Unauthorized webhook.' });
        return;
      }

      
      // Jira webhook payload usually contains issue.key and issue.fields.status.name
      const issueKey = payload?.issue?.key;
      const statusName = payload?.issue?.fields?.status?.name;
      
      if (!issueKey) {
        res.status(400).json({ success: false, message: 'Invalid Jira payload format. Missing issue key.' });
        return;
      }

      const normalizedIssueKey = String(issueKey).trim().toUpperCase();

      // Check if this Jira ticket is linked to a TreY obligation
      const linkResult = await pool.query(
        `SELECT il.obligation_id, o.created_by 
         FROM integration_links il
         JOIN obligations o ON il.obligation_id = o.id
         WHERE il.integration_type = $1 AND il.external_reference_id = $2`,
        ['jira', normalizedIssueKey]
      );

      if (linkResult.rows.length === 0) {
        // We acknowledge the webhook but take no action (not tracked by us)
        res.status(200).json({ success: true, message: 'Ticket not tracked by TreY.' });
        return;
      }

      const obligationId = linkResult.rows[0].obligation_id;
      const linkedUserId = linkResult.rows[0].created_by;

      // If the ticket is marked as Done
      if (statusName && statusName.toLowerCase() === 'done') {

        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // 1. Mark obligation as closed
          await client.query(
            "UPDATE obligations SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'open'",
            [obligationId]
          );

          // 2. Add an Audit Log using correct repository method
          // Use the original creator of the obligation as the executing proxy 
          await client.query(
            `INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, new_value, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            ['obligation', obligationId, 'OBLIGATION_AUTO_CLOSED', linkedUserId, { integration: 'jira', ticket: normalizedIssueKey }, 'WebhookController']
          );

          await client.query('COMMIT');
          
          res.status(200).json({ success: true, message: `Obligation ${obligationId} auto-completed from Jira.`});
          return;
          
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }

      // If not "Done", ignore
      res.status(200).json({ success: true, message: 'Webhook received. No status change needed.' });
    } catch (error) {
      console.error('[Jira Webhook Error]', error);
      res.status(500).json({ success: false, message: 'Internal server error processing Jira webhook.' });
    }
  };

  /**
   * Captures Slack webhooks or slash commands.
   * e.g., an engineer types "/trey evidence [ticket] [message]" in a threaded conversation.
   */
  handleSlackWebhook = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const payload = req.body;
      // Security constraint: Validate Slack Signature
      const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
      if (slackSigningSecret) {
        const slackSignature = req.headers['x-slack-signature'] as string;
        const slackRequestTimestamp = req.headers['x-slack-request-timestamp'] as string;
        if (!slackSignature || !slackRequestTimestamp) {
           res.status(401).send();
           return;
        }
        const time = Math.floor(new Date().getTime() / 1000);
        if (Math.abs(time - parseInt(slackRequestTimestamp, 10)) > 300) {
           res.status(401).send();
           return;
        }
        const sigBasestring = 'v0:' + slackRequestTimestamp + ':' + JSON.stringify(req.body);
        const mySignature = 'v0=' + crypto.createHmac('sha256', slackSigningSecret).update(sigBasestring).digest('hex');
        const expectedSigBuffer = Buffer.from(mySignature, 'utf8');
        const receivedSigBuffer = Buffer.from(slackSignature, 'utf8');
        if (
          expectedSigBuffer.length !== receivedSigBuffer.length ||
          !crypto.timingSafeEqual(expectedSigBuffer, receivedSigBuffer)
        ) {
           res.status(401).send();
           return;
        }
      }

      // Slack events URL verification challenge
      if (payload.type === 'url_verification') {
        res.status(200).json({ challenge: payload.challenge });
        return;
      }

      // Handle message events
      const event = payload.event;
      if (!event || event.type !== 'message' || event.bot_id) {
        res.status(200).send();
        return;
      }

      const channelId = event.channel;
      const text = event.text;
      const slackUserId = event.user;

      if (!channelId || !text) {
        res.status(200).send();
        return;
      }

      // Check if this Slack channel is linked to a TreY obligation
      const linkResult = await pool.query(
        `SELECT il.obligation_id, o.created_by 
         FROM integration_links il
         JOIN obligations o ON il.obligation_id = o.id
         WHERE il.integration_type = $1 AND il.external_reference_id = $2`,
        ['slack', channelId]
      );

      if (linkResult.rows.length === 0) {
        res.status(200).send();
        return;
      }

      const obligationId = linkResult.rows[0].obligation_id;
      const linkedUserId = linkResult.rows[0].created_by;

      // Extract evidence if there's a specific trigger word, e.g. "evidence"
      // or we can just capture all messages as evidence for now. 
      // Let's say if message has #evidence
      if (!text.toLowerCase().includes('#evidence')) {
        res.status(200).send();
        return;
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Save text as a snapshot evidence file
        const fileName = `slack_evidence_${Date.now()}.json`;
        const uploadsDir = path.join(__dirname, '../../uploads/evidence');
        
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const filePath = path.join(uploadsDir, fileName);
        const evidenceContent = {
          source: 'Slack',
          channel_id: channelId,
          slack_user: slackUserId,
          message: text,
          timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(filePath, JSON.stringify(evidenceContent, null, 2));

        // Create Evidence Record
        const evidenceResult = await client.query(
          `INSERT INTO evidence (obligation_id, file_name, file_path, file_size, uploaded_by)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [obligationId, fileName, `/uploads/evidence/${fileName}`, Buffer.byteLength(JSON.stringify(evidenceContent)), linkedUserId]
        );

        // Audit Log
        await client.query(
          `INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, new_value, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          ['evidence', evidenceResult.rows[0].id, 'EVIDENCE_AUTO_CAPTURED', linkedUserId, { integration: 'slack', channel: channelId }, 'WebhookController']
        );

        await client.query('COMMIT');
        console.log(`[Slack Webhook] Evidence successfully captured for Obligation ${obligationId}`);
        res.status(200).send();
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[Slack Webhook Error]', error);
      res.status(500).json({ success: false, message: 'Internal server error processing Slack webhook.' });
    }
  };
}
