import { sqliteTable, integer } from "drizzle-orm/sqlite-core";

export const baz = sqliteTable("baz", {
  id: integer().primaryKey(),
});
