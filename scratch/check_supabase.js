import { StaffAPI, MasterDataAPI } from "./src/api/client.js";

async function check() {
    console.log("Checking MasterData...");
    const data = await MasterDataAPI.fetchFull();
    console.log("MasterData result:", JSON.stringify(data, null, 2));
    
    console.log("Checking Staff...");
    const staff = await StaffAPI.getAll();
    console.log("Staff count:", staff.length);
}

check();
