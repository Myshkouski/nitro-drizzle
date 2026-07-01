import { defineTask } from "nitropack/runtime";
import { migrate, type MigrationResult } from "./migrate";
import type { DatasourceRegistry } from "nitro-drizzle/runtime";

export default defineTask<MigrationResult>({
  meta: {
    name: "drizzle:migrate",
    description: "Run migrations for a datasource",
  },
  async run(event) {
    let result: MigrationResult;
    try {
      const { name } = event.payload as { name: keyof DatasourceRegistry };
      result = await migrate(name);
    } catch (error) {
      result = { error };
    }

    return { result };
  },
});
