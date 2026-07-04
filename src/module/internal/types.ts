import type { NitroOptions, NitroTypes, VirtualModule } from "nitropack/types";
import { dirname, join, resolve } from "pathe";
import { relativeWithDot } from "./path";
import { writeFile } from "./fs";
import type { VirtualModules } from "nitro-drizzle/shared";

export function addTsConfigInclude(nitroTypes: NitroTypes, paths: readonly string[]) {
  nitroTypes.tsConfig ||= {};
  nitroTypes.tsConfig.include ||= [];
  nitroTypes.tsConfig.include.push(...paths);
}

export async function addAugmentations(
  nitroOptions: NitroOptions,
  nitroTypes: NitroTypes,
  augmentations: VirtualModules<`${string}.d.ts`>,
) {
  const paths = await writeTypeFiles(nitroOptions, augmentations);
  addTsConfigInclude(nitroTypes, paths);
}

export async function addDeclarations(
  nitroOptions: NitroOptions,
  nitroTypes: NitroTypes,
  declarations: Record<string, VirtualModules<`${string}.d.ts`>>,
) {
  nitroTypes.tsConfig ||= {};
  nitroTypes.tsConfig.compilerOptions ||= {};
  nitroTypes.tsConfig.compilerOptions.paths ||= {};

  for (const alias in declarations) {
    const paths = await writeTypeFiles(nitroOptions, declarations[alias]);

    nitroTypes.tsConfig.compilerOptions.paths[alias] = paths.map((path) =>
      path.replace(/\.d\.ts$/, ""),
    );
  }
}

function typesDir(nitroOptions: NitroOptions) {
  return join(nitroOptions.buildDir, "types");
}

function tsconfigDir(nitroOptions: NitroOptions) {
  const tsConfigPath = resolve(nitroOptions.buildDir, nitroOptions.typescript.tsconfigPath);
  const tsconfigDir = dirname(tsConfigPath);
  return tsconfigDir;
}

async function writeTypeFiles(nitroOptions: NitroOptions, modules: VirtualModules) {
  const paths: string[] = [];
  const dir = typesDir(nitroOptions);
  for (const filename in modules) {
    const typesFilename = join(dir, filename);
    await writeFile(typesFilename, await getContent(modules[filename]));
    const relativeFilename = relativeWithDot(tsconfigDir(nitroOptions), typesFilename);
    paths.push(relativeFilename);
  }
  return paths;
}

async function getContent(module: VirtualModule) {
  return "string" == typeof module ? module : await module();
}
