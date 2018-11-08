import { Dependency, IndexedObject, OFMResult } from './types';

export const getDependencyConstructor = (dependency: Dependency): string => {
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

export const importsSorter = (a: string, b: string) => {
  const starter = "console.warn";
  return (
    Number(b.substr(0, starter.length) === starter) -
    Number(a.substr(0, starter.length) === starter)
  );
};

export const functionToString = (fn: Function): string => {
  const fnString = fn.toString();
  if (!fnString || fnString.length === 0) {
    return "()=>{}";
  }
  return fnString.startsWith("(") || fnString.startsWith("function")
    ? fnString
    : `function ${fnString}`;
};

export const objectToString = (obj: IndexedObject): string => {
  const mapResult = objectFunctionMapper(obj, 1);

  let result = JSON.stringify(obj);
  for (const entry of mapResult.map) {
    result = result.replace(`"${entry[0]}"`, entry[1]);
  }
  return result;
};

export const objectFunctionMapper = (obj: IndexedObject, counter: number): OFMResult => {
  let map = new Map<string, string>();
  
  for (const prop in obj) {
    const element = obj[prop];
    switch (typeof obj[prop]) {
      case "function":
        const key = `$$Function${counter++}$$`;
        map.set(key, obj[prop].toString());
        obj[prop] = key;
        break;
      case "object":
        const childObject = objectFunctionMapper(obj[prop], counter);
        counter = childObject.counter;
        obj[prop] = childObject.source;
        map = new Map([...map, ...childObject.map]);
        break;
    }
  }

  return { source: obj, map: map, counter: counter};
}