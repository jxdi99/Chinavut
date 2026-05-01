const https = require('https');

const SUPABASE_URL = "https://lgzupozkfkllssgpnwnm.supabase.co/rest/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenVwb3prZmtsbHNzZ3Bud25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTc4MzEsImV4cCI6MjA5MTI5MzgzMX0.tITz0Zys9j5YixYqXLGz_ubHbj6sQ4HoZRw1NSkPkss";

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const options = {
      method: method,
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  console.log("Testing Supabase API...");
  
  // 1. Read
  const readRes = await makeRequest('GET', '/led_models?select=*&limit=1');
  console.log("GET led_models status:", readRes.status);
  if (readRes.status >= 400) console.error("Error:", readRes.data);
  
  // 2. Delete
  const delRes = await makeRequest('DELETE', '/led_models?id=neq.00000000-0000-0000-0000-000000000000');
  console.log("DELETE led_models status:", delRes.status);
  if (delRes.status >= 400) console.error("Error:", delRes.data);

}

test();
