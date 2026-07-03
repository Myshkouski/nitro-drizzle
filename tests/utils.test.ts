import { describe, it, expect } from "vitest";
import { usePrimaryColumns } from "nitro-drizzle/utils";
import { pgTable, integer, text } from "drizzle-orm/pg-core";

describe("usePrimaryColumns", () => {
  it("should extract primary key", () => {
    const table = pgTable("test", {
      id: integer("id").primaryKey(),
      name: text("name"),
    });
    const columns = usePrimaryColumns(table);
    expect(columns).toHaveProperty("id");
    expect(columns).not.toHaveProperty("name");
  });
});
