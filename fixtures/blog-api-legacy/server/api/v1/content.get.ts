import { useDatasource } from "nitro-drizzle/runtime";

export default defineEventHandler(async (event) => {
  await event.context.drizzle.waitReady();

  const { database, schema } = await useDatasource("content");
  const [posts, comments] = await Promise.all([
    database.query.posts
      .findMany({
        limit: 10,
        with: {
          comments: true,
        },
      })
      .execute(),
    database.select().from(schema.comments).limit(10),
  ]);

  // This throws TypeError: Transaction function cannot return a promise
  // See https://github.com/drizzle-team/drizzle-orm/issues/5063#issuecomment-4229858506
  // const { posts, comments } = await database.transaction(async (tx) => {
  //   const [posts, comments] = await Promise.all([
  //     tx.select().from(schema.posts).limit(10),
  //     tx.select().from(schema.comments).limit(10),
  //   ])
  //   return { posts, comments };
  // });

  return {
    posts,
    comments,
  };
});
