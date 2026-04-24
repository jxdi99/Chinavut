import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lgzupozkfkllssgpnwnm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenVwb3prZmtsbHNzZ3Bud25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTc4MzEsImV4cCI6MjA5MTI5MzgzMX0.tITz0Zys9j5YixYqXLGz_ubHbj6sQ4HoZRw1NSkPkss";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    const { data, error } = await supabase.from('service_requests').select('*').limit(1);
    if (error) {
        console.log('Error:', error.message);
        if (error.message.includes('relation "service_requests" does not exist')) {
            console.log('TABLE_MISSING');
        }
    } else {
        console.log('TABLE_EXISTS');
    }
}

checkTable();
