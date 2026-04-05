import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { migrate } from "drizzle-orm/neon-http/migrator"

if (!process.env.DATABASE_URL)
  throw new Error("Database URL is not present in .env")

async function runMigration() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const db = drizzle(sql)

    await migrate(db, { migrationsFolder: "./drizzle" })

    console.log("All migrations are done")
  } catch (error) {
    console.log("Error while migrating: ", error)
    process.exit(1)
  }
}

runMigration()
