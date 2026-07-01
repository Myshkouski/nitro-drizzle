import type { NitroConfig } from "nitropack/core";
import type { DatasourceOptions } from "..";

export function getDatasourceOptions(nitroOptions: NitroConfig, options: DatasourceOptions = {}) {
  return nitroOptions.experimental?.database
    ? nitroOptions.dev
      ? nitroOptions.devDatabase
      : nitroOptions.database
    : options;
}
