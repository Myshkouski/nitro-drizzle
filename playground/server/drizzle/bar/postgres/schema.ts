import { pgTable, serial } from "drizzle-orm/pg-core";

export const qux = pgTable("qux", {
  id: serial().primaryKey(),
});
