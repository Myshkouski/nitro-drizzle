import { genImport, genObjectFromRaw, genSafeVariableName, genString } from "knitwork";
import type { DatasourceInfo } from "..";
import type { VirtualModules } from "nitro-drizzle/shared";

function genDatabaseModuleVariableName(dbModuleIndex: number) {
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

function runtimeVirtualModule(datasources: DatasourceInfo[]) {
   const parts = datasources
     .map(({ name, imports: { schema, connector } }, dbModuleIndex) => {
       const databaseModuleVariableName = genDatabaseModuleVariableName(dbModuleIndex);

       const imports = [
         genImport(connector, databaseModuleVariableName),
         ...schema.map((schemaModuleId, schemaModuleIdIndex) => {
           return genImport(schemaModuleId, {
             name: "*",
             as: genSchemaModuleVariableName(dbModuleIndex, schemaModuleIdIndex),
           });
         }),
       ].join("\n");

       const code = /* js */ `
       datasourceRegistry[${genString(name)}] = ${genObjectFromRaw({
         create: /* js */ `function (config) { return ${databaseModuleVariableName}(config, this.schema) }`,
         schema: `Object.assign({}${mergeSchemaModules(schema, dbModuleIndex)})`,
       })};
     `;

       return {
         imports,
         code,
       };
     })
     .reduce(
       (acc, { imports, code }) => {
         return {
           imports: [...acc.imports, imports],
           code: [...acc.code, code],
         };
       },
       { imports: [] as string[], code: [] as string[] },
     );

   const datasourceRegistryVarName = genSafeVariableName("datasourceRegistry");

   return /* js */ `
     ${parts.imports.join("\n")}
     
     const ${datasourceRegistryVarName} = {};
     
     ${parts.code.join("\n")}

     export function useDatasourceRegistry() {
       return ${datasourceRegistryVarName};
     }
   `;
}

/**
 * Generates virtual modules for runtime datasource access.
 * Creates module code that registers datasource providers and exposes a registry.
 * @param datasources - Array of datasource information
 * @returns Object mapping module IDs to their code
 */
export function virtualModules(datasources: DatasourceInfo[]): VirtualModules {
  return {
    "#nitro-drizzle/runtime": runtimeVirtualModule(datasources),
    // ...dialectVirtualModules(datasources)
  };
}

// Replaced with aliases
// function dialectVirtualModules(datasources: DatasourceInfo[]): VirtualModules {
//   return Object.fromEntries(
//     datasources.filter(d => d.enabled).map(({ name, dialect }) => {
//       return [
//         `#nitro-drizzle/dialects/${name}`,
//         `export * from "nitro-drizzle/dialects/${dialect}";`
//       ]
//     })
//   )
// }
