export interface Dependency {
  name: string;
  dependency: any;
}

export type Func<T> = (...args: any[]) => Promise<T>;
export type ResponseObject = { result?: any; error?: any };
export type Indexable = { [key: string]: any };

export enum WorkerState {
  Idle,
  Busy,
  Preparing,
  Updating
}
