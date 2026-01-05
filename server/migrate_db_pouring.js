import sql from 'mssql';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function migrate() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        console.log('Applying migration - Adding no_of_mould_poured to pouring_details...');

        await pool.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[pouring_details]') AND name = 'no_of_mould_poured')
            BEGIN
                ALTER TABLE pouring_details ADD no_of_mould_poured INT;
                PRINT 'Added no_of_mould_poured column to pouring_details';
            END
            ELSE
            BEGIN
                PRINT 'no_of_mould_poured column already exists in pouring_details';
            END
        `);

        console.log('Migration completed successfully.');
        await pool.close();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
