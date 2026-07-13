import { relations } from "drizzle-orm/relations";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { comments } from "./comments";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull().defaultNow(),
  authors: text("authors", { mode: "json" }).$type<number[]>(),
});

export const postsRelations = relations(posts, ({ many }) => ({
  comments: many(comments),
}));
