import { defineConfig } from "nitro-drizzle/config";

export default defineConfig(
  {
    strict: true,
    dialect: "sqlite",
    schema: "./sqlite/schema.ts",
    out: "./sqlite/migrations",
    casing: "snake_case",
  },
  import.meta.url,
);
