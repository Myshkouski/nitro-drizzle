import {
  genExport,
  genImport,
  genObjectFromRaw,
  genObjectFromRawEntries,
  genSafeVariableName,
  genString,
} from "knitwork";
import type { DatasourceInfo } from "..";
import type { VirtualModules } from "nitro-drizzle/shared";

function genDatasourceModuleVariableName(dbModuleIndex: number) {
  return genSafeVariableName(`dbModule${dbModuleIndex}`);
}

const genSchemaModuleVariableName = (dbModuleIndex: number, schemaIndex: number) =>
  genSafeVariableName(`schemaModule${dbModuleIndex}_${schemaIndex}`);

function mergeSchemaModules(schemaIds: string[], dbModuleIndex: number) {
  return schemaIds
    .map((_, schemaModuleIdIndex) => {
      return ", " + genSchemaModuleVariableName(dbModuleIndex, schemaModuleIdIndex);
    })
    .join("");
}

export function runtimeVirtualModule(datasources: DatasourceInfo[]) {
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

      const entries: [string, string][] = [
        [
          genString(name),
          genObjectFromRaw({
            create: /* js */ `function (config) { return ${datasourceModuleVariableName}(config, this.schema) }`,
            schema: `Object.assign({}${mergeSchemaModules(schema, datasourceIndex)})`,
          }),
        ],
      ];

      return {
        imports,
        entries,
      };
    })
    .reduce(
      (acc, { imports, entries }) => {
        return {
          imports: [...acc.imports, ...imports],
          entries: [...acc.entries, ...entries],
        };
      },
      { imports: [] as string[], entries: [] as [string, string][] },
    );

  const datasourceRegistryVarName = genSafeVariableName("datasourceRegistry");

  return /* js */ `
    ${parts.imports.join("\n")}
    
    const ${datasourceRegistryVarName} = ${genObjectFromRawEntries(parts.entries)};

    export function useDatasourceRegistry() {
      return ${datasourceRegistryVarName};
    }
  `;
}

// Replaced with aliases
export function dialectVirtualModules(
  datasources: DatasourceInfo[],
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
