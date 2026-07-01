import { defineConfig } from "nitro-drizzle/config";

export default defineConfig(
  {
    strict: true,
    dialect: "sqlite",
    out: "./sqlite/migrations",
    schema: ["./sqlite/schema.ts"],
    migrations: {
      table: "drizzle_migrations",
    },
  },
  import.meta.url,
);
