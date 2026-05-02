import { supabase } from "./src/api/client.js";

async function checkColumns() {
    const { data, error } = await supabase.from("led_models").select("*").limit(1);
    if (error) {
        console.error(error);
        return;
    }
    if (data && data.length > 0) {
        console.log("Column Names:", Object.keys(data[0]));
        console.log("Sample Data:", data[0]);
    }
}

checkColumns();
