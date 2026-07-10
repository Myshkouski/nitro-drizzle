import { mysqlTable, int, serial, text, timestamp } from "drizzle-orm/mysql-core";

export const comments = mysqlTable("comments", {
  id: serial("id").primaryKey(),
  postId: int("post_id").notNull(),
  authorId: int("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});
