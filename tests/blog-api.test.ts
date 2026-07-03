import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createNitro, build, prerender, copyPublicAssets, prepare, Nitro } from "nitropack";
import { resolve } from "pathe";
import { type Listener, listen } from "listhen";

describe("blog-api", { timeout: 60000 }, () => {
  let nitro: Nitro;
  let listener: Listener;

  beforeAll(async () => {
    const rootDir = resolve("fixtures/blog-api");

    nitro = await createNitro({
      rootDir,
      dev: false,
      debug: false,
      preset: "node-listener",
      runtimeConfig: {
        drizzle: {
          content: {
            url: ":memory:",
          },
          users: {
            dataDir: "memory://",
          },
        },
      },
    });

    await prepare(nitro);
    await copyPublicAssets(nitro);
    await prerender(nitro);
    await build(nitro);

    const outDir = resolve(rootDir, ".output");

    const entryPath = resolve(outDir, "server/index.mjs");
    const { listener: nodeListener } = await import(entryPath);

    listener = await listen(nodeListener);
  });

  afterAll(async () => {
    await listener.close();
  });

  it("should fetch users", async () => {
    const url = new URL("/api/v1/users", listener.url);
    const res = await fetch(url);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.authors).toHaveLength(2);
    expect(data.authors[0]).toMatchObject({ id: 1, name: "John Doe", email: "john@example.com" });
    expect(data.authors[1]).toMatchObject({ id: 2, name: "Jane Smith", email: "jane@example.com" });
  });

  it("should fetch content", async () => {
    const url = new URL("/api/v1/content", listener.url);
    const res = await fetch(url);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.posts).toHaveLength(3);
    expect(data.posts[0]).toMatchObject({ id: 1, title: "Nuxt Icon v1" });
    expect(data.posts[1]).toMatchObject({ id: 2, title: "Nuxt 3.14" });
    expect(data.posts[2]).toMatchObject({ id: 3, title: "Nuxt 3.13" });
  });
});
