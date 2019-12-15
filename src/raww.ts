import { Dependency, Func, Indexable } from "./types";
import { namedFunctionToString, getDependencyConstructor } from "./utils";
import { RawwMarshal } from "./marshal";
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

declare var Worker: {
  prototype: Worker;
  new (stringUrl: string, options: {}): Worker;
};

const tslibDependencies: Indexable = {
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
    target[propertyKey] = raww(target[propertyKey], ...dependencies);
    return target;
  };
}

export function raww<T>(fn: Func<T>, ...dependencies: Indexable[]): Func<T> {
  if (fn == null || typeof fn !== "function") {
    return fn;
  }

  const dependencyBlobs: string[] = [
    tslibDependencies,
    { tslib: tslibDependencies }
  ]
    .concat(...dependencies)
    .reduce<Dependency[]>((arr, map) => {
      for (const entry in map) {
        arr.push({ name: entry, dependency: map[entry] });
      }
      return arr;
    }, [])
    .map(getDependencyConstructor)
    .filter(v => v !== null)
    .map(str => str + "\r\n");

  const renderArray = dependencyBlobs.concat(namedFunctionToString(fn));
  const fnBlob = new Blob(renderArray, { type: "text/javascript" });
  const uniqueName = RawwMarshal.register(fnBlob);
  if (!uniqueName) {
    return fn;
  }

  let replaceFunction = (...args: any[]) => {
    return RawwMarshal.exec<T>(uniqueName, ...args);
  };
  return replaceFunction;
}
