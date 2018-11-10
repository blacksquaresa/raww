import { Dependency } from "./types";

let counter = 1;
let functionMap = new Map<string, string>();

export const getDependencyConstructor = (dependency: Dependency): string => {
  if (dependency === null || dependency === undefined) {
    return "";
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

export const functionToString = (fn: Function): string => {
  const fnString = fn.toString();
  if (typeof fn !== "function" || !fnString || fnString.length === 0) {
    return "()=>{}";
  }
  return fnString.startsWith("(") || fnString.startsWith("function")
    ? fnString
    : `function ${fnString}`;
};

export const objectToString = (obj: { [key: string]: any }): string => {
  if (typeof obj === "function") {
    return functionToString(obj);
  }
  
  if (typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  const mapResult = objectFunctionMapper(obj);

  let result = JSON.stringify(mapResult);
  for (const entry of functionMap) {
    result = result.replace(
      new RegExp(`"${entry[0].replace(/\$/g, "\\$")}"`, "g"),
      entry[1]
    );
  }
  return result;
};

const objectFunctionMapper = (obj: {
  [key: string]: any;
}): { [key: string]: any } => {
  const working: { [key: string]: any } = {};
  for (const prop in obj) {
    switch (typeof obj[prop]) {
      case "function":
        const key = `$$Function${counter++}$$`;
        functionMap.set(key, obj[prop].toString());
        working[prop] = key;
        break;
      case "object":
        const childObject = objectFunctionMapper(obj[prop]);
        working[prop] = childObject;
        break;
      default:
        working[prop] = obj[prop];
    }
  }

  return working;
};
