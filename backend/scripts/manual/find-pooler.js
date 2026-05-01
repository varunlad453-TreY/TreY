const { Pool } = require('pg'); 
const regions = [
  'aws-0-ap-south-1', 
  'aws-0-ap-southeast-1', 
  'aws-0-ap-southeast-2', 
  'aws-0-ap-northeast-1', 
  'aws-0-ap-northeast-2', 
  'aws-0-ap-northeast-3', 
  'aws-0-us-east-1', 
  'aws-0-us-east-2', 
  'aws-0-us-west-1', 
  'aws-0-us-west-2', 
  'aws-0-eu-central-1', 
  'aws-0-eu-west-1', 
  'aws-0-eu-west-2', 
  'aws-0-eu-west-3', 
  'aws-0-sa-east-1', 
  'aws-0-ca-central-1'
]; 
async function check(region) { 
  const url = 'postgresql://postgres.dpcuhpdhzpdkvwkttvku:Guccigeng77@' + region + '.pooler.supabase.com:6543/postgres'; 
  const p = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 }); 
  try { 
    await p.query('SELECT 1'); 
    console.log('✅ FOUND WORKING URL:', url); 
    process.exit(0); 
  } catch (e) { 
    // ignore
  } finally { 
    p.end(); 
  } 
}; 
Promise.all(regions.map(check)).then(()=>setTimeout(()=>{
  console.log('Done scanning regions, no matches found.');
  process.exit(1);
}, 6000));
