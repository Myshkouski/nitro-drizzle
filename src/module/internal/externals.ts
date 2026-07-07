import type { NitroOptions } from "nitropack/types";

export function addInlineExternals(nitroOptions: NitroOptions, moduleIds: readonly string[]) {
  // @ts-expect-error
  nitroOptions.externals ||= {};
  nitroOptions.externals.inline ||= [];
  nitroOptions.externals.inline.push(...moduleIds);
}
