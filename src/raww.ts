import { Dependency } from "./types";
import { functionToString, getDependencyConstructor } from "./utils";
import {
  __extends,
  __assign,
  __rest,
  __decorate,
  __param,
  __metadata,
  __awaiter,
  __generator,
  __exportStar,
  __values,
  __read,
  __spread,
  __spreadArrays,
  __await,
  __asyncGenerator,
  __asyncDelegator,
  __asyncValues,
  __makeTemplateObject,
  __importStar,
  __importDefault
} from "tslib";

export type Func<T> = (...args: any[]) => Promise<T>;
type ResponseObject = { result?: any; error?: any };
type Indexable = { [key: string]: any };

declare var Worker: {
  prototype: Worker;
  new (stringUrl: string, options: {}): Worker;
};

const tslibDependencies = {
  __extends: __extends,
  __assign: __assign,
  __rest: __rest,
  __decorate: __decorate,
  __param: __param,
  __metadata: __metadata,
  __awaiter: __awaiter,
  __generator: __generator,
  __exportStar: __exportStar,
  __values: __values,
  __read: __read,
  __spread: __spread,
  __spreadArrays: __spreadArrays,
  __await: __await,
  __asyncGenerator: __asyncGenerator,
  __asyncDelegator: __asyncDelegator,
  __asyncValues: __asyncValues,
  __makeTemplateObject: __makeTemplateObject,
  __importStar: __importStar,
  __importDefault: __importDefault
};

export function RunAsWebWorker(...dependencies: Indexable[]): any {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): any {
    target[propertyKey] = raww(
      target[propertyKey],
      tslibDependencies,
      { tslib: tslibDependencies },
      ...dependencies
    );
    return target;
  };
}

export function raww<T>(fn: Func<T>, ...dependencies: Indexable[]): Func<T> {
  if (fn == null || typeof fn !== "function") {
    return fn;
  }

  const dependencyBlobs: string[] = dependencies
    .reduce<Dependency[]>((arr, map) => {
      for (const entry in map) {
        arr.push({ name: entry, dependency: map[entry] });
      }
      return arr;
    }, [])
    .map(getDependencyConstructor)
    .filter(v => v !== null)
    .map(str => str + "\r\n");

  const workerCode = () => {
    self.addEventListener(
      "message",
      function(e) {
        $$$$(...e.data).then(
          result => {
            (self as any).postMessage({ result });
          },
          err => {
            (self as any).postMessage({ error: err });
          }
        );
      },
      false
    );
  };

  function $$$$(...data: any[]): Promise<T> {
    // prettier-ignore
    return (fn).call({}, ...data);
  }

  const renderArray = dependencyBlobs.concat([
    `${$$$$.toString().replace("fn", functionToString(fn))};`,
    "(",
    workerCode.toString(),
    ")();"
  ]);

  const workerBlob = new Blob(renderArray, { type: "text/javascript" });

  let worker = new Worker(window.URL.createObjectURL(workerBlob), {
    name: fn.name
  });

  let replaceFunction = (...args: any[]) => {
    return new Promise<T>((resolve, reject) => {
      const act = (e: MessageEvent) => {
        worker.removeEventListener("message", act);
        worker.removeEventListener("messageerror", err);
        const result = e.data as ResponseObject;
        result.result ? resolve(result.result) : reject(result.error);
      };
      const err = (e: Event) => {
        worker.removeEventListener("message", act);
        worker.removeEventListener("messageerror", err);
        reject("an unserialisable response has been received");
      };
      worker.addEventListener("message", act, false);
      worker.addEventListener("messageerror", err, false);
      worker.postMessage(args);
    });
  };
  return replaceFunction;
}
