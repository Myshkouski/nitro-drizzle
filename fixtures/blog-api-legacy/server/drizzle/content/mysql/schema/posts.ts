import { mysqlTable, serial, text, timestamp, json } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm/sql";

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
