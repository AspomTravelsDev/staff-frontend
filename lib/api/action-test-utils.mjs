import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "../..");

/** Load real actions with mocked HTTP calls; no live records or credentials are used. */
export function actionLoader(apiCall, overrides = {}) {
  const cache = new Map();
  const logs = [];
  const navigation = {
    unstable_rethrow(error) {
      if (typeof error?.digest === "string" && (error.digest.startsWith("NEXT_") ||
        ["DYNAMIC_SERVER_USAGE", "BAILOUT_TO_CLIENT_SIDE_RENDERING", "HANGING_PROMISE_REJECTION"].includes(error.digest))) throw error;
      if (error instanceof Error && error.cause) navigation.unstable_rethrow(error.cause);
    },
    redirect(url) { throw Object.assign(new Error("redirect"), { digest: `NEXT_REDIRECT;replace;${url};307;` }); },
    notFound() { throw Object.assign(new Error("not found"), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" }); },
  };
  const api = Object.fromEntries(["get", "post", "patch", "put", "delete"].map(method => [method, (...args) => apiCall(method, ...args)]));
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const source = readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const execute = new vm.Script(`(function(require, module, exports, console) { ${compiled}\n})`, { filename }).runInThisContext();
    execute(name => {
      if (name in overrides) return overrides[name];
      if (name === "server-only") return {};
      if (name === "next/navigation") return navigation;
      if (name === "next/cache") return { revalidatePath() {} };
      if (name === "./client" || name === "@/lib/api/client") return { api, apiClient: (...args) => apiCall("request", ...args), shouldMock: () => false };
      if (name === "@/lib/utils") return { delay: async () => {} };
      if (name === "@/lib/auth/session") return { getAuthToken: async () => "test-token" };
      const dependency = name.startsWith("@/") ? name.slice(2) : path.relative(root, path.resolve(path.dirname(filename), name));
      return load(`${dependency}.ts`);
    }, loadedModule, loadedModule.exports, { error: (...args) => logs.push(args), warn: (...args) => logs.push(args), log() {} });
    return loadedModule.exports;
  }
  return { load, logs };
}
