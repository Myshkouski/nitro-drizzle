import { genTypeImport, genAugmentation, genInlineTypeImport, genString } from "knitwork";
import type { DatasourceInfo } from "..";
import type { VirtualModules } from "nitro-drizzle/shared";

function runtimeDeclarations(datasources: DatasourceInfo[]) {
  return [
    genTypeImport("nitro-drizzle/runtime", ["ToDatasourceProvider"]),
    genAugmentation("nitro-drizzle/runtime", {
      DatasourceRegistry: Object.fromEntries(
        datasources
          .filter((datasource) => {
            return datasource.enabled;
          })
          .map(({ name, imports }): [string, string] => {
            const schemaType = genSchemaType(imports.schema);
            const driverType = genInlineTypeImport(imports.connector);
            return [name, `${"ToDatasourceProvider"}<${schemaType}, ${driverType}<${schemaType}>>`];
          }),
      ),
    }),
  ].join("\n");
}

function genSchemaType(imports: string[]) {
  return imports.map((id) => `typeof import('${id}')`).join(" & ");
}

function moduleDeclarations(datasources: DatasourceInfo[]) {
  const names = datasources.map((d) => d.name);

  return [
    genTypeImport("nitro-drizzle/module", ["ModuleOptions"]),
    genAugmentation("nitro-drizzle/module", {
      DatasourceOptions: [
        {},
        {
          extends: `Record<${names.map((n) => genString(n)).join(" | ")}, { connector: string; }>`,
        },
      ],
    }),
  ].join("\n");
}

export function augmentations(datasources: DatasourceInfo[]): VirtualModules<`${string}.d.ts`> {
  return {
    "nitro-drizzle/augmentations.d.ts": [
      runtimeDeclarations(datasources),
      moduleDeclarations(datasources),
      /* ts */ `export {};`,
    ].join("\n"),
  };
}

function dialectDeclarations(datasources: DatasourceInfo[]) {
  return datasources
    .filter((d) => d.enabled)
    .map(({ name, dialect }) => {
      return /*ts*/ `
      declare module "#nitro-drizzle/dialects/${name}" {
        export * from "nitro-drizzle/dialects/${dialect}";
      }
    `;
    })
    .join("\n");
}

export function declarations(
  datasources: DatasourceInfo[],
): Record<string, VirtualModules<`${string}.d.ts`>> {
  return {
    "#nitro-drizzle/*": {
      "nitro-drizzle/declarations.d.ts": [dialectDeclarations(datasources)].join("\n"),
    },
  };
}
