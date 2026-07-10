import { defineHandler } from "nitro";
import { useDatasource } from "nitro-drizzle/runtime";

export default defineHandler(async (event) => {
  await event.context.drizzle.waitReady();

  const { database, schema } = await useDatasource("users");
  const authors = await database.select().from(schema.authors).limit(10);
  return { authors };
});
