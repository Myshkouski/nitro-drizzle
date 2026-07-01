import type { VirtualModule } from "nitropack/types";

export type VirtualModules<TName extends string = string> = Record<TName, VirtualModule>
