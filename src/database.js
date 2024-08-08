import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

async function initDB() {
    const db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    });

    await db.exec(`CREATE TABLE IF NOT EXISTS building_info(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        info TEXT NOT NULL
    )
        `);

        return db;
}

export default initDB