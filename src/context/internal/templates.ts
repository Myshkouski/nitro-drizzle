import {
  genTypeImport,
  genAugmentation,
  genInlineTypeImport,
  genString,
  genExport,
} from "knitwork";
import type { DatasourceInfo } from "..";
import type { VirtualModules } from "nitro-drizzle/shared";
import { script } from "./format";

export function runtimeDeclarations(datasources: readonly DatasourceInfo[]) {
  if (!datasources.length) {
    return "";
  }

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

export type TypeReference = { types: string };

export type PathReference = { path: string };

export function genReference(reference: TypeReference | PathReference) {
  return /* ts */ `/// <reference ${Object.entries(reference)
    .map(([prop, value]) => `${prop}="${value}"`)
    .join("")} />`;
}

export function moduleTypeDeclarations(
  datasources: readonly DatasourceInfo[],
): VirtualModules<`${string}.d.ts`> {
  if (!datasources.length) {
    return {};
  }

  const names = datasources.map((d) => d.name);

  const moduleId = "nitro-drizzle/module";

  const content = [
    genReference({ types: moduleId }),
    genAugmentation(moduleId, {
      DatasourceOptions: [
        {},
        {
          extends: `Record<${names.map((n) => genString(n)).join(" | ")}, { connector: string; }>`,
        },
      ],
    }),
    /* ts */ `export {};`,
  ].join("\n");

  return {
    "nitro-drizzle/module.d.ts": content,
  };
}

export function dialectDeclarations(datasources: readonly DatasourceInfo[]) {
  return datasources
    .filter((d) => d.enabled)
    .map(({ name, dialect }) => {
      return script /* ts */ `
        declare module "#nitro-drizzle/dialects/${name}" {
          ${genExport(`nitro-drizzle/dialects/${dialect}`, "*")}
        }
      `;
    })
    .join("\n");
}
