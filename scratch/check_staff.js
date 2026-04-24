import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lgzupozkfkllssgpnwnm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenVwb3prZmtsbHNzZ3Bud25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTc4MzEsImV4cCI6MjA5MTI5MzgzMX0.tITz0Zys9j5YixYqXLGz_ubHbj6sQ4HoZRw1NSkPkss";
const supabase = createClient(supabaseUrl, supabaseKey);

// Get all columns by selecting *
const { data, error } = await supabase.from('staff').select('*').limit(3);
if (error) {
  console.error("Error:", error);
} else {
  console.log("Columns:", Object.keys(data[0]));
  console.log("Sample data:");
  data.forEach(row => console.log(JSON.stringify(row, null, 2)));
}
