import type { NitroOptions, NitroTypes, VirtualModule } from "nitropack/types";
import type { Context } from "nitro-drizzle/context";
import { join } from "pathe";
import { relativeWithDot } from "./path";
import { writeFile } from "./fs";

/**
 * Extends Nitro's TypeScript configuration with Drizzle type declarations.
 * Writes virtual module type declarations to the build directory.
 * @param moduleContext - The context providing type declarations
 * @param nitroOptions - Nitro configuration options
 * @param nitroTypes - Nitro type extensions
 */
export async function extendTypes(
   moduleContext: Context,
   nitroOptions: NitroOptions,
   nitroTypes: NitroTypes,
) {
   const content = await moduleContext.typeDeclarations();

   for (const filename in content) {
     const typesDir = join(nitroOptions.buildDir, "types");
     const typesFilename = join(typesDir, filename);
     await writeFile(typesFilename, await getContent(content[filename]));

     const relativeFilename = relativeWithDot(typesDir, typesFilename);
     nitroTypes.tsConfig!.include?.push(relativeFilename);
   }
}

async function getContent(module: VirtualModule) {
   return "string" == typeof module ? module : await module();
}