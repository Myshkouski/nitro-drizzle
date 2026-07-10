import type { RequestListener } from "http";
import { listen, type Listener } from "listhen";
import { afterAll, beforeAll, expect, it } from "vitest";

export function setupNitroTest(requestListener: RequestListener) {
  let listener: Listener;

  beforeAll(async () => {
    listener = await listen(requestListener);
  });

  afterAll(async () => {
    await listener.close();
  });

  it("should fetch users", { timeout: 30_000 }, async () => {
    const url = new URL("/api/v1/users", listener.url);
    const res = await fetch(url);
    expect(res.status).toBe(200);
    const data = await res.json();
    // @ts-ignore
    expect(data.authors).toHaveLength(2);
    // @ts-ignore
    expect(data.authors[0]).toMatchObject({ id: 1, name: "John Doe", email: "john@example.com" });
    // @ts-ignore
    expect(data.authors[1]).toMatchObject({ id: 2, name: "Jane Smith", email: "jane@example.com" });
  });

  it("should fetch content", { timeout: 30_000 }, async () => {
    const url = new URL("/api/v1/content", listener.url);
    const res = await fetch(url);
    expect(res.status).toBe(200);
    const data = await res.json();
    // @ts-ignore
    expect(data.posts).toHaveLength(3);
    // @ts-ignore
    expect(data.posts[0]).toMatchObject({ id: 1, title: "Nuxt Icon v1" });
    // @ts-ignore
    expect(data.posts[1]).toMatchObject({ id: 2, title: "Nuxt 3.14" });
    // @ts-ignore
    expect(data.posts[2]).toMatchObject({ id: 3, title: "Nuxt 3.13" });

    // @ts-ignore
    expect(data.comments).toHaveLength(2);
    // @ts-ignore
    expect(data.comments[0]).toMatchObject({
      id: 1,
      postId: 1,
      authorId: 2,
      content: "Great first post!",
    });
    // @ts-ignore
    expect(data.comments[1]).toMatchObject({
      id: 2,
      postId: 1,
      authorId: 1,
      content: "Thanks for the comment!",
    });
  });
}
