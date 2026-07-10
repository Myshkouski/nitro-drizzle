import { defineNitroPlugin } from "nitropack/runtime";
import { consola } from "consola";
import { colorize } from "consola/utils";
import { useDatasource } from "nitro-drizzle/runtime";
import { usePrimaryColumns } from "nitro-drizzle/utils";

import { onConflictDoNothing } from "#nitro-drizzle/dialects/users";

import * as sampleData from "nitro-drizzle-sample-data/users";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("drizzle:migrate:after", async (name) => {
    if (name !== "users") return;

    await seedUsers();
    consola.info("Seed completed:", colorize("greenBright", name));
  });
});

async function seedUsers() {
  const { database, schema } = await useDatasource("users");

  await onConflictDoNothing(
    usePrimaryColumns(schema.authors),
    database.insert(schema.authors).values(sampleData.authors),
  );
}
