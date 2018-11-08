import { Dependency, Func, IndexedObject, ResponseObject } from './types';
import { functionToString, getDependencyConstructor, importsSorter } from './utils';

declare var Worker: {
  prototype: Worker;
  new (stringUrl: string, options: {}): Worker;
};

export function RunAsWebWorker(...dependencies: IndexedObject[]): any {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): any {
    target[propertyKey] = raww(target[propertyKey], ...dependencies);
    return target;
  };
}

export function raww<T>(fn: Func<T>, ...dependencies: IndexedObject[]): Func<T> {
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
    .sort(importsSorter)
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
