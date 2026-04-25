import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const requiredTables = [
  'organizations',
  'users',
  'obligations',
  'obligation_owners',
  'slas',
  'evidence',
  'audit_logs',
  'integration_links'
];

const requiredMigrationArtifacts = ['_migrations'];

async function validateDatabaseSetup(): Promise<void> {
  try {
    console.log('[DB Validate] Starting database validation...');

    const tableResult = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'`
    );

    const present = new Set(tableResult.rows.map((row: { table_name: string }) => row.table_name));

    const missingTables = requiredTables.filter((t) => !present.has(t));
    const missingArtifacts = requiredMigrationArtifacts.filter((t) => !present.has(t));

    if (missingTables.length > 0 || missingArtifacts.length > 0) {
      console.error('[DB Validate] FAILED');
      if (missingTables.length > 0) {
        console.error(`Missing required tables: ${missingTables.join(', ')}`);
      }
      if (missingArtifacts.length > 0) {
        console.error(`Missing migration artifacts: ${missingArtifacts.join(', ')}`);
      }
      process.exit(1);
      return;
    }

    const migrationCountResult = await pool.query('SELECT COUNT(*)::int AS count FROM _migrations');
    const migrationCount = migrationCountResult.rows[0]?.count ?? 0;

    console.log('[DB Validate] PASSED');
    console.log(`[DB Validate] Found ${requiredTables.length} required tables.`);
    console.log(`[DB Validate] Applied migrations: ${migrationCount}`);
  } catch (error: any) {
    console.error('[DB Validate] FAILED with error:', error?.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void validateDatabaseSetup();
