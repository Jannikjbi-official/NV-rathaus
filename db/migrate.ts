/**
 * Führt die SQL-Migrationen aus db/migrations über den HTTP-Treiber von Neon
 * aus (funktioniert auch dort, wo Port 5432 nicht erreichbar ist).
 * Aufruf: pnpm db:migrate
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) throw new Error("DATABASE_URL fehlt.");

migrate(drizzle(neon(url)), { migrationsFolder: "db/migrations" }).then(() => console.log("Migrationen ausgeführt."));
