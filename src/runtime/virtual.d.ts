import type { DatasourceRegistry, RuntimeConfig } from "nitro-drizzle/runtime";
import type { ConfigHookArgs } from ".";
import type { Storage } from "unstorage";

export declare function useRuntimeConfig(): RuntimeConfig | undefined;
export declare function useDatasourceRegistry(): DatasourceRegistry;
export declare function useStorage(base: string): Storage<string>;
export declare function onServerClose(cb: () => MaybePromise<void>): () => void;
export declare function callConfigHook(...args: ConfigHookArgs): void | Promise<void>;

export declare const initHooks:
  | readonly (
      | "cloudflare:durable:init"
      | "cloudflare:durable:alarm"
      | "request"
      | "cloudflare:email"
      | "cloudflare:queue"
      | "cloudflare:scheduled"
      | "cloudflare:tail"
      | "cloudflare:trace"
      | "request"
    )[]
  | undefined;
