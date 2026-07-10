import { migrate, type MigrationResult } from "./migrate";
import type { DatasourceRegistry } from "nitro-drizzle/runtime";
import type { Task as LegacyTask } from "nitropack/types";
import type { Task } from "nitro/types";

const task: Task<MigrationResult> | LegacyTask<MigrationResult> = {
  async run(event) {
    const { name } = event.payload as { name: keyof DatasourceRegistry & string };
    const result = await migrate(name);
    return { result };
  },
};

export default task;
