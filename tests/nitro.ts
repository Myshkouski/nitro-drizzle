import { resolve } from "pathe";
import type { RequestListener } from "http";
import { build, copyPublicAssets, createNitro, prepare, prerender } from "nitro/builder";
import { pkgDir } from "nitro-drizzle/meta";

export async function buildNitro(dir: string) {
  const rootDir = resolve(pkgDir, dir);
  const nitro = await createNitro({
    rootDir,
    preset: "node-middleware",
  });

  await prepare(nitro);
  await copyPublicAssets(nitro);
  await prerender(nitro);
  await build(nitro);

  const outDir = resolve(rootDir, ".output");

  const entryPath = resolve(outDir, "server/index.mjs");
  const { middleware } = await import(entryPath);

  return middleware as RequestListener;
}
