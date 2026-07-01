import { defineConfig } from "nitro-drizzle/config";

export default defineConfig(
  {
    dialect: "postgresql",
    driver: "pglite",
    out: "./postgres/migrations",
    schema: ["./postgres/schema.ts"],
    migrations: {
      table: "drizzle_migrations",
    },
  },
  import.meta.url,
);
