import { defineConfig } from "nitro-drizzle/config";

export default defineConfig(
  {
    strict: true,
    dialect: "postgresql",
    driver: "pglite",
    schema: ["./postgresql/schema/posts.ts", "./postgresql/schema/comments.ts"],
    out: "./postgresql/migrations",
  },
  import.meta.url,
);
