require('dotenv').config();
const { pool } = require('./src/config/database');
const { WebhookController } = require('./src/controllers/webhookController');
const { AuditRepository } = require('./src/repositories/auditRepository');

async function testWebhooks() {
  try {
    // 1. Get an active user/org
    const userRes = await pool.query('SELECT id, organization_id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No users found to test with.');
      return;
    }
    const user = userRes.rows[0];

    // 2. Create a dummy obligation
    const obRes = await pool.query(`
      INSERT INTO obligations (organization_id, title, description, owner_id) 
      VALUES ($1, 'Test Slack/Jira Integration', 'Dummy desc', $2) RETURNING id
    `, [user.organization_id, user.id]);
    const obligationId = obRes.rows[0].id;

    console.log('âœ… Created Test Obligation:', obligationId);

    // 3. Create the Link (simulating the POST /api/webhooks/link route)
    await pool.query(
      `INSERT INTO integration_links (organization_id, obligation_id, integration_type, external_reference_id)
       VALUES ($1, $2, $3, $4)`,
      [user.organization_id, obligationId, 'jira', 'SEC-999']
    );
    console.log('âœ… Linked Obligation to Jira Ticket: SEC-999');

    // 4. Simulate a Jira Webhook Payload
    const fakeReq = {
      body: {
        issue: {
          key: 'SEC-999',
          fields: { status: { name: 'Done' } }
        }
      }
    };
    
    let responseJson = {};
    const fakeRes = {
      status: (code) => ({
        json: (data) => { responseJson = data; console.log(\`[Webhook Status \${code}]:\`, data); }
      })
    };

    const controller = new WebhookController();
    await controller.handleJiraWebhook(fakeReq, fakeRes, () => {});

    // 5. Verify the DB updated
    const finalOb = await pool.query('SELECT status FROM obligations WHERE id = $1', [obligationId]);
    console.log('âœ… Final Obligation Status in DB:', finalOb.rows[0].status);

    const auditRes = await pool.query("SELECT * FROM audit_logs WHERE resource_id = $1 AND action = 'OBLIGATION_AUTO_COMPLETED'", [obligationId]);
    console.log('âœ… Audit Log Created:', auditRes.rows.length > 0);

    // Cleanup
    await pool.query('DELETE FROM obligations WHERE id = $1', [obligationId]);
    
  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    pool.end();
  }
}

testWebhooks();
