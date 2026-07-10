import type { Nitro as LegacyNitro } from "nitropack/types";
import type { Nitro } from "nitro/types";

export function isLegacy(nitro: Nitro | LegacyNitro): nitro is LegacyNitro {
  return nitro.meta.majorVersion < 3;
}
