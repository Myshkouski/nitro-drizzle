import { defineNitroPlugin } from "nitropack/runtime";
import { consola } from "consola";
import { colorize } from "consola/utils";
import { useDatasource } from "nitro-drizzle/runtime";
import { usePrimaryColumns } from "nitro-drizzle/utils";

import { onConflictDoNothing } from "#nitro-drizzle/dialects/content";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("drizzle:migrate:after", async (name) => {
    if (name !== "content") return;

    await seedContent();
    consola.info("Seed completed:", colorize("greenBright", name));
  });
});

async function seedContent() {
  const { database, schema } = await useDatasource("content");

  await onConflictDoNothing(
    usePrimaryColumns(schema.posts),
    database.insert(schema.posts).values([
      {
        id: 1,
        title: "Nuxt Icon v1",
        description: "Discover Nuxt Icon v1!",
        image: "https://nuxt.com/assets/blog/nuxt-icon/cover.png",
        date: new Date("2024-11-25"),
        authors: [1, 2],
      },
      {
        id: 2,
        title: "Nuxt 3.14",
        description: "Nuxt 3.14 is out!",
        image: "https://nuxt.com/assets/blog/v3.14.png",
        date: new Date("2024-11-04"),
        authors: [1],
      },
      {
        id: 3,
        title: "Nuxt 3.13",
        description: "Nuxt 3.13 is out!",
        image: "https://nuxt.com/assets/blog/v3.13.png",
        date: new Date("2024-08-22"),
        authors: [2],
      },
    ]),
  );
}
