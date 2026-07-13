import { defineConfig } from "nitro-drizzle/config";

export default defineConfig(
  {
    strict: true,
    dialect: "postgresql",
    driver: "pglite",
    schema: "./postgresql/schema.ts",
    out: "./postgresql/migrations",
    casing: "snake_case",
  },
  import.meta.url,
);
