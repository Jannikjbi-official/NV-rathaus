import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL fehlt. Siehe .env.example.");
}

export const db = drizzle(neon(url), { schema, casing: "snake_case" });
export { schema };
