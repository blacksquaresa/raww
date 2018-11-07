type Func<T> = (...args: any[]) => Promise<T>;
type ResponseObject = { result?: any; error?: any };
type DependencyMap = { [key: string]: any };
interface Dependency {
  name: string;
  dependency: any;
}

export function RunAsWebWorker(...dependencies: DependencyMap[]): any {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): any {
    target[propertyKey] = raww(target[propertyKey], ...dependencies);
    return target;
  };
}

export function raww<T>(
  fn: Func<T>,
  ...dependencies: DependencyMap[]
): Func<T> {
  if (fn == null || typeof fn !== "function") {
    return fn;
  }

  let requiresAsync = false;

  const getDependencyConstructor = (dependency: Dependency): string => {
    if (dependency === null || dependency === undefined) {
      return "";
    }

    if (dependency.name[0] === "$") {
      const actualName = dependency.name.substr(1);
      requiresAsync = true;
      return `const ${actualName} = await import('${dependency.dependency}');`;
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
      default:
        return "";
    }
  };

  const dependencyBlobs: string[] = dependencies
    .reduce<Dependency[]>((arr, map) => {
      for (const entry in map) {
        arr.push({ name: entry, dependency: map[entry] });
      }
      return arr;
    }, [])
    .map(dependency => getDependencyConstructor(dependency))
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
    return fn.call({}, ...data);
  }

  const renderArray = dependencyBlobs.concat([
    `${$$$$.toString().replace("fn", functionToString(fn))};`,
    "(",
    workerCode.toString(),
    ")();"
  ]);

  if (requiresAsync) {
    renderArray.unshift("(async function(){");
    renderArray.push("})()");
  }
  const workerBlob = new Blob(renderArray, { type: "text/javascript" });

  let worker = new Worker(window.URL.createObjectURL(workerBlob));

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
