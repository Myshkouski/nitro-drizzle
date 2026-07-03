import { defineConfig } from "nitro-drizzle/config";

export default defineConfig(
  {
    strict: true,
    dialect: "mysql",
    schema: ["./mysql/schema/posts.ts", "./mysql/schema/comments.ts"],
    out: "./mysql/migrations",
  },
  import.meta.url,
);
