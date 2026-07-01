import type { Config as DrizzleConfig } from "drizzle-kit";
import type { DatasourceInfo, Resolver } from "..";
import { resolve } from "pathe";
import { genObjectKey } from "knitwork";

export async function transformDrizzleConfig(
  drizzleConfig: DrizzleConfig,
  { dirName, path, resolver, cwd, datasourceOptions }: TransformDrizzleConfigOptions,
): Promise<DatasourceInfo> {
  const driver = "driver" in drizzleConfig ? drizzleConfig.driver : undefined;
  const dialect = drizzleConfig.dialect;
  return {
    dirName,
    name: genObjectKey(dirName.replace(DISABLED_DATASOURCE_DIRNAME_REGEX, "")),
    enabled:
      !DISABLED_DATASOURCE_DIRNAME_REGEX.test(dirName) &&
      (datasourceOptions?.connector == driver || datasourceOptions?.connector == dialect),
    dialect,
    driver,
    imports: {
      config: path,
      schema: (drizzleConfig.schema ? [drizzleConfig.schema].flat() : []).map((schemaFilename) => {
        return resolver.resolve(resolve(cwd, schemaFilename));
      }),
      // connector: resolver.tryResolve(resolve(cwd, './driver')) || resolver.resolve(join(connectorsDir, driver || dialect)),
      // connector: resolver.resolve(`nitro-drizzle/drivers/${driver || dialect}`),
      connector: `nitro-drizzle/drivers/${driver || dialect}`,
      helpers: `nitro-drizzle/dialects/${driver || dialect}`,
    },
    migrations: {
      assets: drizzleConfig.out ? resolve(cwd, drizzleConfig.out) : undefined,
      config: drizzleConfig.migrations,
    },
  };
}

const DISABLED_DATASOURCE_DIRNAME_REGEX = /^[_-]+/;

export type TransformDrizzleConfigOptions = {
  dirName: string;
  path: string;
  cwd: string;
  resolver: Resolver;
  datasourceOptions?: { connector: string };
};
