type Func<T> = (...args: any[]) => Promise<T>;
type ResponseObject = { result?: any; error?: any };
type IndexedObject = { [key: string]: any };

interface Dependency {
  name: string;
  dependency: any;
}

declare var Worker: {
  prototype: Worker;
  new (stringUrl: string, options: {}): Worker;
};

let counter = 1;

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

  const getDependencyConstructor = (dependency: Dependency): string => {
    if (dependency === null || dependency === undefined) {
      return "";
    }

    if (dependency.name[0] === "$") {
      const actualName = dependency.name.substr(1);
      const impt =
        typeof dependency.dependency === "string"
          ? { source: dependency.dependency }
          : dependency.dependency;
      return `console.warn('Module imports are not yet supported by browsers');`;
    }

    switch (typeof dependency.dependency) {
      case "string":
        return `const ${dependency.name} = '${dependency.dependency}';`;
      case "number":
        return `const ${dependency.name} = ${dependency.dependency};`;
      case "boolean":
        return `const ${dependency.name} = !!${dependency.dependency ? 1 : 0};`;
      case "function":
        return `const ${dependency.name} = ${functionToString(
          dependency.dependency
        )};`;
      case "object":
        return `const ${dependency.name} = ${objectToString(
          dependency.dependency
        )};`;
      default:
        return "";
    }
  };

  const importsSorter = (a: string, b: string) => {
    const starter = "console.warn";
    return (
      Number(b.substr(0, starter.length) === starter) -
      Number(a.substr(0, starter.length) === starter)
    );
  };

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

const functionToString = (fn: Function): string => {
  const fnString = fn.toString();
  if (!fnString || fnString.length === 0) {
    return "()=>{}";
  }
  return fnString.startsWith("(") || fnString.startsWith("function")
    ? fnString
    : `function ${fnString}`;
};

const objectToString = (obj: IndexedObject): string => {
  const functionMap = new Map();
  for (const prop in obj) {
    const element = obj[prop];
    switch (typeof obj[prop]) {
      case "function":
        const key = `$$Function${counter++}$$`;
        functionMap.set(key, obj[prop].toString());
        obj[prop] = key;
        break;
      case "object":
        obj[prop] = objectToString(obj[prop]);
        break;
    }
  }

  let result = JSON.stringify(obj);
  for (const entry of functionMap) {
    result = result.replace(`"${entry[0]}"`, entry[1]);
  }
  return result;
};
