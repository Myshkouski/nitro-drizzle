import { defineMiddleware } from "nitro";
import { useNitroHooks } from "nitro/app";
import type { Middleware } from "nitro/h3";

let eventContext: DrizzleContext | undefined;

const middleware: Middleware = defineMiddleware((event): void => {
  if (!eventContext) {
    const hooks = useNitroHooks();

    let readyState: ReadyState = "pending";
    let initHook: Promise<void>;

    initHook = Promise.resolve(hooks.callHook("drizzle:init"))
      .then(() => {
        readyState = "done";
      })
      .catch((err) => {
        readyState = "error";
        throw err;
      });

    eventContext = {
      get readyState() {
        return readyState;
      },
      waitReady: async () => {
        await initHook;
      },
    };
  }

  event.context.drizzle = eventContext;
});

export default middleware;

export type ReadyState = "pending" | "done" | "error";

export type InitHooks = {
  "drizzle:init": () => void;
};

declare module "nitro/types" {
  interface NitroRuntimeHooks extends InitHooks {}
}

export interface DrizzleContext {
  readonly readyState: ReadyState;
  readonly waitReady: () => Promise<void>;
}

export interface EventContext {
  drizzle: DrizzleContext;
}

declare module "srvx" {
  interface ServerRequestContext extends EventContext {}
}
