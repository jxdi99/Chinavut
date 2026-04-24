const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://lgzupozkfkllssgpnwnm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenVwb3prZmtsbHNzZ3Bud25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTc4MzEsImV4cCI6MjA5MTI5MzgzMX0.tITz0Zys9j5YixYqXLGz_ubHbj6sQ4HoZRw1NSkPkss";
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Checking user 'test1'...");
    const { data: staff, error: fetchErr } = await supabase
        .from('staff')
        .select('*')
        .ilike('username', 'test1')
        .single();
    
    if (fetchErr) {
        console.error("Fetch Error:", fetchErr);
        return;
    }
    
    console.log("Found staff:", staff.id, staff.username, staff.email);
    if (staff.email !== 'test123@gmail.com') {
        console.log("Email mismatch!", staff.email);
        return;
    }

    console.log("Calling RPC 'update_staff_password'...");
    const { error: rpcErr } = await supabase.rpc('update_staff_password', {
        staff_id: staff.id,
        new_password: 'new_password_123'
    });

    if (rpcErr) {
        console.error("RPC Error:", rpcErr);
    } else {
        console.log("RPC Success! Password updated.");
        
        // Let's reset it back just in case
        console.log("Resetting password back to original...");
        await supabase.rpc('update_staff_password', {
            staff_id: staff.id,
            new_password: staff.password
        });
        console.log("Reset back successfully.");
    }
}

test();
