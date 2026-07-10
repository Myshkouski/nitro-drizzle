import type {
  Nitro as LegacyNitro,
  NitroOptions as LegacyNitroOptions,
  NitroTypes as LegacyNitroTypes,
  VirtualModule,
} from "nitropack/types";
import type { Nitro, NitroOptions, NitroTypes } from "nitro/types";
import { dirname, join, resolve } from "pathe";
import { relativeWithDot } from "./path";
import { writeFile } from "./fs";
import type { VirtualModules } from "nitro-drizzle/shared";
import { isLegacy } from "../utils/nitro";

export function addTsConfigInclude(nitroTypes: LegacyNitroTypes, paths: readonly string[]) {
  nitroTypes.tsConfig ||= {};
  nitroTypes.tsConfig.include ||= [];
  nitroTypes.tsConfig.include.push(...paths);
}

export async function addAugmentations(
  nitroOptions: Nitro | LegacyNitro,
  nitroTypes: LegacyNitroTypes,
  augmentations: VirtualModules<`${string}.d.ts`>,
) {
  const paths = await writeTypeFiles(nitroOptions, augmentations);
  addTsConfigInclude(nitroTypes, paths);
}

export async function addDeclarations(
  nitro: Nitro | LegacyNitro,
  nitroTypes: NitroTypes | LegacyNitroTypes,
  declarations: Record<string, VirtualModules<`${string}.d.ts`>>,
) {
  nitroTypes.tsConfig ||= {};
  nitroTypes.tsConfig.compilerOptions ||= {};
  nitroTypes.tsConfig.compilerOptions.paths ||= {};

  for (const alias in declarations) {
    const paths = await writeTypeFiles(nitro, declarations[alias]);

    nitroTypes.tsConfig.compilerOptions.paths[alias] = paths.map((path) =>
      path.replace(/\.d\.ts$/, ""),
    );
  }
}

function getTypesDir(nitroOptions: NitroOptions | LegacyNitroOptions) {
  return join(nitroOptions.buildDir, "types");
}

function getTsConfigDir(nitro: Nitro | LegacyNitro) {
  const tsConfigPath = resolve(
    isLegacy(nitro) ? nitro.options.buildDir : getTypesDir(nitro.options),
    nitro.options.typescript.tsconfigPath || "tsconfig.json",
  );
  const tsconfigDir = dirname(tsConfigPath);
  return tsconfigDir;
}

async function writeTypeFiles(nitro: Nitro | LegacyNitro, modules: VirtualModules) {
  const paths: string[] = [];
  const typesDir = getTypesDir(nitro.options);
  const tsConfigDir = getTsConfigDir(nitro);
  for (const filename in modules) {
    const typesFilename = join(typesDir, filename);
    await writeFile(typesFilename, await getContent(modules[filename]));
    const relativeFilename = relativeWithDot(tsConfigDir, typesFilename);
    paths.push(relativeFilename);
  }
  return paths;
}

async function getContent(module: VirtualModule) {
  return "string" == typeof module ? module : await module();
}
