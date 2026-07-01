import type { NitroOptions } from "nitropack/types";
import { pkgDir, pkgName } from "nitro-drizzle/meta";
import { join } from "node:path";

const inlineModuleIds = ["runtime", "plugins", "migrations"].flatMap((id) => {
  return [join(pkgName, id), join(pkgDir, "dist", id)];
});

export function addInlineExternals(nitroOptions: NitroOptions) {
  // @ts-expect-error
  nitroOptions.externals ||= {};
  nitroOptions.externals.inline ||= [];
  nitroOptions.externals.inline.push(...inlineModuleIds);
}
