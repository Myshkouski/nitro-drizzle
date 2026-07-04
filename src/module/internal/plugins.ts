import type { PluginName } from "nitro-drizzle/context";
import type { NitroOptions } from "nitropack";
import type { ModuleOptions } from "..";

export function enablePlugins(
  nitroOptions: NitroOptions,
  moduleOptions: ModuleOptions,
): readonly PluginName[] {
  const plugins: PluginName[] = [];

  if (moduleOptions.migrations && moduleOptions.migrations.migrateOnInit) {
    plugins.push("migrate");
  }

  plugins.push("init");

  nitroOptions.plugins.push(...plugins);

  return plugins;
}
