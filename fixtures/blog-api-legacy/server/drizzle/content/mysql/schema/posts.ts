import { mysqlTable, serial, text, timestamp, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm/relations";
import { sql } from "drizzle-orm/sql";
import { comments } from "./comments";

export const posts = mysqlTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  date: timestamp("date", { mode: "date" }).notNull().defaultNow(),
  authors: json("authors")
    .$type<number[]>()
    .notNull()
    .default(sql`('[]')`),
});

export const postsRelations = relations(posts, ({ many }) => ({
  comments: many(comments),
}));
