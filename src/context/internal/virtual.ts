import {
  genArrayFromRaw,
  genExport,
  genImport,
  genObjectFromRaw,
  genObjectFromRawEntries,
  genSafeVariableName,
  genString,
} from "knitwork";
import type { DatasourceInfo, MigrationOptions } from "..";
import type { VirtualModules } from "nitro-drizzle/shared";

function genDatasourceModuleVariableName(dbModuleIndex: number) {
  return genSafeVariableName(`dbModule${dbModuleIndex}`);
}

function genMergedSchemaVariableName(dbModuleIndex: number) {
  return genSafeVariableName(`mergedSchema${dbModuleIndex}`);
}

const genSchemaModuleVariableName = (dbModuleIndex: number, schemaIndex: number) =>
  genSafeVariableName(`schemaModule${dbModuleIndex}_${schemaIndex}`);

function mergeSchemaModules(schemaIds: string[], dbModuleIndex: number) {
  return /* js */ `
    Object.assign(
      ${[
        /* js */ `{}`,
        ...schemaIds.map((_, schemaModuleIdIndex) =>
          genSchemaModuleVariableName(dbModuleIndex, schemaModuleIdIndex),
        ),
      ].join(",")}
    )
  `;
}

export function runtimeVirtualModule(datasources: readonly DatasourceInfo[]) {
  const parts = datasources
    .filter((datasource) => datasource.enabled)
    .map(({ name, imports: { schema, connector } }, datasourceIndex) => {
      const datasourceModuleVariableName = genDatasourceModuleVariableName(datasourceIndex);

      const imports = [
        genImport(connector, datasourceModuleVariableName),
        ...schema.map((schemaModuleId, schemaIndex) => {
          return genImport(schemaModuleId, {
            name: "*",
            as: genSchemaModuleVariableName(datasourceIndex, schemaIndex),
          });
        }),
      ];

      const mergedSchemaVariableName = genMergedSchemaVariableName(datasourceIndex);
      const mergedSchemaObject = mergeSchemaModules(schema, datasourceIndex);

      const schemaDefinitions = [
        /* js */ `const ${mergedSchemaVariableName} = ${mergedSchemaObject};`,
      ];

      const entries: [string, string][] = [
        [
          name,
          genObjectFromRaw({
            create: /* js */ `(config) => ${datasourceModuleVariableName}(config, ${mergedSchemaVariableName})`,
            schema: mergedSchemaVariableName,
          }),
        ],
      ];

      return {
        imports,
        schemaDefinitions,
        entries,
      };
    })
    .reduce(
      (acc, { imports, schemaDefinitions, entries }) => {
        return {
          imports: [...acc.imports, ...imports],
          schemaDefinitions: [...acc.schemaDefinitions, ...schemaDefinitions],
          entries: [...acc.entries, ...entries],
        };
      },
      {
        imports: [] as string[],
        schemaDefinitions: [] as string[],
        entries: [] as [string, string][],
      },
    );

  const datasourceRegistryVarName = genSafeVariableName("datasourceRegistry");

  return /* js */ `
    ${parts.imports.join("\n")}
    
    ${parts.schemaDefinitions.join("\n")}
    
    const ${datasourceRegistryVarName} = ${genObjectFromRawEntries(parts.entries)};

    export function useDatasourceRegistry() {
      return ${datasourceRegistryVarName};
    }
  `;
}

// Replaced with aliases
export function dialectVirtualModules(
  datasources: readonly DatasourceInfo[],
): VirtualModules<`#nitro-drizzle/${string}`> {
  return Object.fromEntries(
    datasources
      .filter((d) => d.enabled)
      .map(({ name, dialect }) => {
        return [
          `#nitro-drizzle/dialects/${name}`,
          genExport(`nitro-drizzle/dialects/${dialect}`, "*"),
        ] as const;
      }),
  );
}

export function migrationsVirtualModule(
  datasources: readonly DatasourceInfo[],
  options: MigrationOptions | undefined,
): VirtualModules<`#nitro-drizzle/${string}`> {
  if (!options) {
    return {};
  }

  const parts: string[] = [];

  const enabledDatasources = datasources.filter((d) => d.enabled);

  parts.push(/*js*/ `
    export const migrationConfig = ${genObjectFromRawEntries(
      enabledDatasources.map(({ name, migrations }) => {
        return [name, JSON.stringify(migrations.config)];
      }),
    )};
  `);

  let migrateOnInit = enabledDatasources.map((d) => d.name);
  if (options && Array.isArray(options.migrateOnInit)) {
    migrateOnInit = migrateOnInit.filter((name) =>
      (options.migrateOnInit as readonly string[]).includes(name),
    );
  }

  parts.push(/*js*/ `
    export const MIGRATIONS_STORAGE_BASE = ${genString(options.storageBase)};
    export const MIGRATE_ON_INIT = ${genArrayFromRaw(migrateOnInit.map((name) => genString(name)))};
  `);

  return {
    "#nitro-drizzle/migrations": parts.join("\n"),
  };
}
