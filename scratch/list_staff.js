import { StaffAPI } from './src/api/client.js';

async function test() {
    const staff = await StaffAPI.getAll();
    console.log('Staff IDs:', staff.map(s => s.emp_id));
}

test();
