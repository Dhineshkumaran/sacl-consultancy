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

        console.log('Applying migration - Adding plan_moulds and actual_moulds...');

        await pool.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[trial_cards]') AND name = 'plan_moulds')
            BEGIN
                ALTER TABLE trial_cards ADD plan_moulds INT;
                PRINT 'Added plan_moulds column';
            END
            ELSE
            BEGIN
                PRINT 'plan_moulds column already exists';
            END
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[trial_cards]') AND name = 'actual_moulds')
            BEGIN
               ALTER TABLE trial_cards ADD actual_moulds INT;
               PRINT 'Added actual_moulds column';
            END
            ELSE
            BEGIN
                PRINT 'actual_moulds column already exists';
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
