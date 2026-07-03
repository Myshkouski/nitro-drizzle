import { defineTask } from "nitropack/runtime";
import { migrate, type MigrationResult } from "./migrate";
import type { DatasourceRegistry } from "nitro-drizzle/runtime";

export default defineTask<MigrationResult>({
  async run(event) {
    const { name } = event.payload as { name: keyof DatasourceRegistry & string };
    const result = await migrate(name);
    return { result };
  },
});
