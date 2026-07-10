import { resolve } from "pathe";
import type { RequestListener } from "http";
import { build, copyPublicAssets, createNitro, prepare, prerender } from "nitropack";
import { pkgDir } from "nitro-drizzle/meta";

export async function buildLegacyNitro(dir: string) {
  const rootDir = resolve(pkgDir, dir);
  const nitro = await createNitro({
    rootDir,
    preset: "node-listener",
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
