import type { NitroOptions } from "nitropack";
import type { ModuleOptions } from "..";

export function enablePlugins(
  nitroOptions: NitroOptions,
  moduleOptions: ModuleOptions,
): readonly string[] {
  const plugins: ("init" | "migrate")[] = [];

  if (moduleOptions.migrations && moduleOptions.migrations.migrateOnInit) {
    plugins.push("migrate");
  }

  plugins.push("init");

  const pluginIds = plugins.map((pluginName) => `nitro-drizzle/plugins/${pluginName}`);

  nitroOptions.plugins.push(...pluginIds);

  return pluginIds;
}
