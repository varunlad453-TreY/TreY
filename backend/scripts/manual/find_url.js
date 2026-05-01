const { Client } = require('pg');

const regions = [
  'ap-south-1', 'ap-southeast-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'sa-east-1', 'ca-central-1', 'ap-southeast-2'
];

async function test() {
  for (const r of regions) {
    const url = 'postgresql://postgres.dpcuhpdhzpdkvwkttvku:Guccigeng77@aws-0-' + r + '.pooler.supabase.com:6543/postgres';
    console.log('Testing: ' + url);
    const client = new Client({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3500
    });
    try {
      await client.connect();
      await client.query('SELECT 1');
      console.log('✅✅✅ THE EXACT URL IS: ' + url);
      process.exit(0);
    } catch(e) {
      console.log('❌ FAILED: ' + e.message);
    } finally {
      try { await client.end(); } catch(e){}
    }
  }
  console.log('❌ NOT FOUND IN ANY REGION');
}
test();