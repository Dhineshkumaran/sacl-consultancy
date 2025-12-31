import 'dotenv/config';
import Client from '../config/connection.js';

async function checkHod() {
    try {
        console.log("Checking HOD for Department 2 (Methods)...");
        const [rows] = await Client.query(`SELECT user_id, username, role, department_id, is_active FROM users WHERE department_id = 2 AND role = 'HOD'`);
        console.log("HOD Result:", rows);

        console.log("Checking Departments...");
        const [depts] = await Client.query(`SELECT * FROM departments`);
        console.log("Departments:", depts);

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkHod();
