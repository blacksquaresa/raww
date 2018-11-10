import { Dependency } from './types';

type OFMResult = { source: { [key: string]: any }, map: Map<string, string>, counter: number};

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
  if (typeof(fn) !== 'function' || !fnString || fnString.length === 0) {
    return "()=>{}";
  }
  return fnString.startsWith("(") || fnString.startsWith("function")
    ? fnString
    : `function ${fnString}`;
};

export const objectToString = (obj: { [key: string]: any }): string => {
  if(typeof(obj) === 'function'){
    return functionToString(obj);
  }

  const mapResult = objectFunctionMapper(obj, 1);

  let result = JSON.stringify(mapResult.source);
  for (const entry of mapResult.map) {
    result = result.replace(`"${entry[0]}"`, entry[1]);
  }
  return result;
};

const objectFunctionMapper = (obj: { [key: string]: any }, counter: number): OFMResult => {
  let map = new Map<string, string>();
  
  for (const prop in obj) {
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