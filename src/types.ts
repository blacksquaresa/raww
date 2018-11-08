export type Func<T> = (...args: any[]) => Promise<T>;
export type ResponseObject = { result?: any; error?: any };
export type IndexedObject = { [key: string]: any };
export type OFMResult = { source: IndexedObject, map: Map<string, string>, counter: number};

export interface Dependency {
  name: string;
  dependency: any;
}