import { defineNitroPlugin } from "nitropack/runtime";
import { consola } from "consola";
import { colorize } from "consola/utils";
import { useDatasource } from "nitro-drizzle/runtime";
import { usePrimaryColumns } from "nitro-drizzle/utils";

import { onConflictDoNothing } from "#nitro-drizzle/dialects/content";

import * as sampleData from "nitro-drizzle-sample-data/content";

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
    database.insert(schema.posts).values(sampleData.posts),
  );

  await onConflictDoNothing(
    usePrimaryColumns(schema.comments),
    database.insert(schema.comments).values(sampleData.comments),
  );
}
