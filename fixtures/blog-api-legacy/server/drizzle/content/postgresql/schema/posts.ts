import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { comments } from "./comments";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  authors: integer("authors").array(),
});

export const postsRelations = relations(posts, ({ many }) => ({
  comments: many(comments),
}));
