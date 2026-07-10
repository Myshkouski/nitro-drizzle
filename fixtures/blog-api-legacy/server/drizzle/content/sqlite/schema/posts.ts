import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull().defaultNow(),
  authors: text("authors", { mode: "json" }).$type<number[]>(),
});
