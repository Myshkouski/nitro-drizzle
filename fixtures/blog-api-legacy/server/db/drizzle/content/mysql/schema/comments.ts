import { mysqlTable, int, serial, text, timestamp } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm/relations";
import { posts } from "./posts";

export const comments = mysqlTable("comments", {
  id: serial("id").primaryKey(),
  postId: int("post_id")
    .notNull()
    .references(() => posts.id),
  authorId: int("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  comments: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));
