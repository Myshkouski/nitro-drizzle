import { defineConfig } from "nitro-drizzle/config";

export default defineConfig(
  {
    strict: true,
    dialect: "sqlite",
    driver: "d1-http",
    schema: ["./sqlite/schema/posts.ts", "./sqlite/schema/comments.ts"],
    out: "./sqlite/migrations",
  },
  import.meta.url,
);
