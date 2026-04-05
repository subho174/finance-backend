import { defineConfig } from "drizzle-kit"

if (!process.env.DATABASE_URL!)
  throw new Error("Database URL is not present in .env")

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    table: "__drizzle_migration",
    schema: "public",
  },
  verbose: true,
  strict: true,
})
