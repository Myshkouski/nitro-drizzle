import { resolve } from "pathe";
import type { RequestListener } from "http";
import {
  build,
  copyPublicAssets,
  createNitro,
  prepare,
  prerender,
  type NitroConfig,
} from "nitropack";
import { pkgDir } from "nitro-drizzle/meta";

export async function buildLegacyNitro(dir: string, config?: Omit<NitroConfig, "rootDir">) {
  const rootDir = resolve(pkgDir, dir);
  const preset = config?.preset ?? "node-listener";
  const nitro = await createNitro({
    rootDir,
    ...config,
    preset,
  });

  await prepare(nitro);
  await copyPublicAssets(nitro);
  await prerender(nitro);
  await build(nitro);

  const outDir = resolve(rootDir, ".output");

  const entryPath = resolve(outDir, "server/index.mjs");
  const { listener } = await import(entryPath);

  return listener as RequestListener;
}
