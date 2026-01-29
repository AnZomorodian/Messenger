// No real DB connection, but providing the export to satisfy imports if any
// In a real "no db" scenario, we might not even need this file if we clean up imports,
// but to be safe with the template structure:
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

// Warn but don't crash if no DB
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Running in in-memory mode.");
}

// Dummy objects to prevent crashes if something tries to import them
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgres://localhost" });
export const db = drizzle(pool, { schema });
