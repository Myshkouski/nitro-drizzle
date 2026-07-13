import { relations } from "drizzle-orm/relations";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { posts } from "./posts";

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id),
  authorId: integer("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  comments: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));
