import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = "https://lgzupozkfkllssgpnwnm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenVwb3prZmtsbHNzZ3Bud25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTc4MzEsImV4cCI6MjA5MTI5MzgzMX0.tITz0Zys9j5YixYqXLGz_ubHbj6sQ4HoZRw1NSkPkss";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log("Testing Supabase connection...");
  
  // 1. Test Read led_models
  const { data: readData, error: readError } = await supabase.from('led_models').select('*').limit(1);
  console.log("Read led_models:", readError ? "ERROR: " + JSON.stringify(readError) : "SUCCESS (Count: " + readData.length + ")");

  // 2. Test Delete led_models
  const { error: delError } = await supabase.from('led_models').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Delete led_models:", delError ? "ERROR: " + JSON.stringify(delError) : "SUCCESS");

  // 3. Test Insert led_models (dummy data)
  const dummyData = [{
    name: "TEST_MODEL",
    group_id: "UIR",
    price: 100
  }];
  const { error: insertError } = await supabase.from('led_models').insert(dummyData);
  console.log("Insert led_models:", insertError ? "ERROR: " + JSON.stringify(insertError) : "SUCCESS");
  
  if (!insertError) {
    // cleanup
    await supabase.from('led_models').delete().eq('name', 'TEST_MODEL');
  }

}

testSupabase();
