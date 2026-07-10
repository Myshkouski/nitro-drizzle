import type { NitroOptions as LegacyNitroOptions } from "nitropack/types";
import type { NitroOptions } from "nitro/types";

export function addInlineExternals(nitroOptions: LegacyNitroOptions, moduleIds: readonly string[]) {
  // @ts-expect-error
  nitroOptions.externals ||= {};
  nitroOptions.externals.inline ||= [];
  nitroOptions.externals.inline.push(...moduleIds);
}

export function addNoExternals(nitroOptions: NitroOptions, moduleIds: readonly string[]) {
  if (true === nitroOptions.noExternals) {
    return;
  }
  nitroOptions.noExternals ||= [];
  nitroOptions.noExternals.push(...moduleIds);
}
