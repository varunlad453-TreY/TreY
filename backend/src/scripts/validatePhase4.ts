import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { pool } from '../config/database';
import { ObligationService } from '../services/obligationService';
import { EvidenceService } from '../services/evidenceService';

interface ValidationContext {
  organizationId: string;
  creatorUserId: string;
  ownerUserId: string;
  newOwnerUserId: string;
  obligationId: string;
}

const obligationService = new ObligationService();
const evidenceService = new EvidenceService();

async function createValidationData(): Promise<ValidationContext> {
  const orgSlug = randomUUID().slice(0, 8);
  const orgResult = await pool.query(
    `INSERT INTO organizations (name, type) VALUES ($1, $2) RETURNING id`,
    [`Phase4 Validation Org ${orgSlug}`, 'validation']
  );
  const organizationId = orgResult.rows[0].id as string;

  const passwordHash = `phase4-validation-${randomUUID()}`;

  const creatorResult = await pool.query(
    `INSERT INTO users (email, password_hash, name, role, organization_id)
     VALUES ($1, $2, $3, 'admin', $4)
     RETURNING id`,
    [`phase4.creator.${orgSlug}@example.com`, passwordHash, 'Phase4 Creator', organizationId]
  );
  const creatorUserId = creatorResult.rows[0].id as string;

  const ownerResult = await pool.query(
    `INSERT INTO users (email, password_hash, name, role, organization_id)
     VALUES ($1, $2, $3, 'manager', $4)
     RETURNING id`,
    [`phase4.owner.${orgSlug}@example.com`, passwordHash, 'Phase4 Owner', organizationId]
  );
  const ownerUserId = ownerResult.rows[0].id as string;

  const newOwnerResult = await pool.query(
    `INSERT INTO users (email, password_hash, name, role, organization_id)
     VALUES ($1, $2, $3, 'manager', $4)
     RETURNING id`,
    [`phase4.reassign.${orgSlug}@example.com`, passwordHash, 'Phase4 Reassigned Owner', organizationId]
  );
  const newOwnerUserId = newOwnerResult.rows[0].id as string;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 5);

  const createResult = await obligationService.create({
    title: 'Phase4 Lifecycle Validation Obligation',
    description: 'Validation path for Create -> Assign -> Add Evidence -> Close',
    regulationTag: 'PHASE4:VALIDATION',
    ownerId: ownerUserId,
    organizationId,
    userId: creatorUserId,
    slaDueDate: dueDate.toISOString().split('T')[0]
  });

  assert.strictEqual(createResult.success, true, 'Expected obligation creation to succeed');
  assert.ok(createResult.obligation?.id, 'Expected created obligation id');

  return {
    organizationId,
    creatorUserId,
    ownerUserId,
    newOwnerUserId,
    obligationId: createResult.obligation.id as string
  };
}

async function runLifecycleSmokeTest(ctx: ValidationContext): Promise<void> {
  const reassignResult = await obligationService.reassignOwner(
    ctx.obligationId,
    ctx.organizationId,
    ctx.newOwnerUserId,
    'Phase4 lifecycle smoke-test reassignment',
    ctx.creatorUserId,
    '127.0.0.1',
    'phase4-validation'
  );

  assert.strictEqual(reassignResult.success, true, 'Expected owner reassignment to succeed');

  const uploadDir = path.join(__dirname, '../../uploads/evidence');
  fs.mkdirSync(uploadDir, { recursive: true });

  const fileName = `phase4-validation-${randomUUID()}.txt`;
  const absolutePath = path.join(uploadDir, fileName);
  fs.writeFileSync(absolutePath, 'phase4 validation evidence');

  const uploadResult = await evidenceService.upload({
    obligationId: ctx.obligationId,
    file: {
      path: absolutePath,
      originalname: fileName,
      size: Buffer.byteLength('phase4 validation evidence'),
      mimetype: 'text/plain'
    },
    referenceNote: 'Phase4 smoke test evidence upload',
    userId: ctx.newOwnerUserId,
    organizationId: ctx.organizationId,
    ipAddress: '127.0.0.1',
    userAgent: 'phase4-validation'
  });

  assert.strictEqual(uploadResult.success, true, 'Expected evidence upload to succeed');

  const obligationStatusResult = await pool.query(
    `SELECT status, closed_at FROM obligations WHERE id = $1`,
    [ctx.obligationId]
  );

  assert.strictEqual(obligationStatusResult.rows.length, 1, 'Expected obligation row to exist');
  assert.strictEqual(obligationStatusResult.rows[0].status, 'closed', 'Expected obligation to be auto-closed after evidence upload');
  assert.ok(obligationStatusResult.rows[0].closed_at, 'Expected obligation closed_at timestamp');
}

async function runStatusRegressionChecks(ctx: ValidationContext): Promise<void> {
  const invalidStatusResult = await obligationService.updateStatus(
    ctx.obligationId,
    ctx.organizationId,
    'open',
    ctx.creatorUserId,
    '127.0.0.1',
    'phase4-validation'
  );

  assert.strictEqual(invalidStatusResult.success, false, 'Expected invalid status transition to be rejected');
  assert.strictEqual(invalidStatusResult.error, 'VALIDATION_ERROR', 'Expected validation error for non-close status');

  const closedStatusReupdateResult = await obligationService.updateStatus(
    ctx.obligationId,
    ctx.organizationId,
    'breached',
    ctx.creatorUserId,
    '127.0.0.1',
    'phase4-validation'
  );

  assert.strictEqual(closedStatusReupdateResult.success, false, 'Expected closed obligation to reject further status changes');
  assert.strictEqual(closedStatusReupdateResult.error, 'ENFORCEMENT_VIOLATION', 'Expected enforcement violation for invalid state transition');
}

async function main(): Promise<void> {
  console.log('[Phase4 Validation] Starting lifecycle smoke and regression checks...');

  try {
    const ctx = await createValidationData();
    await runLifecycleSmokeTest(ctx);
    await runStatusRegressionChecks(ctx);

    console.log('[Phase4 Validation] PASS: lifecycle and status regression checks completed.');
    process.exit(0);
  } catch (error: any) {
    console.error('[Phase4 Validation] FAIL:', error?.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void main();
