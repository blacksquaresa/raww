import { WorkerState, Indexable } from "./types";
import { DeferredPromise } from "./DeferredPromise";

type Registration = {
  name: string;
  blob: Blob;
};

export class RawwWorker {
  public state: WorkerState = WorkerState.Preparing;
  public name: string;

  private worker: Worker | null = null;
  private resolve: Function | null = null;
  private reject: ((error: Error | string) => void) | null = null;
  private currentId: string | null = null;
  private readyPromise: Promise<void> = Promise.resolve();
  private readyResolver: Function = () => {};
  private funcs: { [key: string]: DeferredPromise } = {};

  public constructor(name: string) {
    this.name = name;
  }

  public prepare(): Promise<void> {
    this.readyPromise = new Promise(resolve => {
      this.readyResolver = resolve;
      this.worker = new Worker(window.URL.createObjectURL(workerBlob), {
        name: this.name
      });
      if (!this.worker) {
        throw new Error("Failed to create a new worker");
      }

      this.worker.addEventListener("message", this.act.bind(this), false);
      this.worker.addEventListener("messageerror", this.err.bind(this), false);
    });

    return this.readyPromise;
  }

  private act(e: MessageEvent) {
    if (e.data.method === "ready") {
      this.readyResolver();
      this.state = WorkerState.Idle;
      return;
    }

    if (e.data.method === "_raww_registered") {
      this.funcs[e.data.params.name].resolve();
      return;
    }

    if (e.data.id !== this.currentId) {
      throw new Error(
        `Received response for the wrong message. Expecting ${this.currentId}, but got a result for ${e.data.id}`
      );
    }

    if (!this.resolve || !this.reject) {
      throw new Error(
        `Received a response for ${e.data.id} after the worker has been cleaned`
      );
    }

    e.data.error ? this.reject(e.data.error) : this.resolve(e.data.result);
    this.clean();
  }

  private err(e: Event) {
    if (!this.resolve || !this.reject) {
      throw new Error(
        `Received an error response after the ${this.name} worker has been cleaned`
      );
    }

    this.reject("an unserialisable response has been received");
    this.clean();
  }

  private clean() {
    this.reject = this.resolve = this.currentId = null;
    this.state = WorkerState.Idle;
  }

  public register(name: string, fn: Blob): void {
    this.funcs[name] = new DeferredPromise();
    this.readyPromise.then(() => {
      this.worker!.postMessage({
        jsonrpc: "2.0",
        method: "_raww_register",
        params: {
          name: name,
          blob: fn
        }
      });
    });
  }

  public exec<T>(method: string, ...params: any): Promise<T> {
    if (!this.funcs[method]) {
      throw new Error(
        `Method ${method} is not registered with worker ${this.name}`
      );
    }

    return this.funcs[method].then(() => {
      if (this.state !== WorkerState.Idle) {
        throw new Error(
          `Worker ${this.name} is busy and cannot process ${method} at this time`
        );
      }

      this.state = WorkerState.Busy;

      return new Promise<T>((resolve, reject) => {
        if (!this.worker) {
          return reject(
            new Error(
              `Worker ${this.name} cannot execute ${method} before it has been prepared`
            )
          );
        }

        this.resolve = resolve;
        this.reject = reject;
        this.currentId = `${this.name}${Date.now()}`;
        this.worker.postMessage({
          jsonrpc: "2.0",
          method: method,
          params: params,
          id: this.currentId
        });
      });
    });
  }
}

var workerCode = () => {
  var funcs: Indexable = {};
  self.addEventListener(
    "message",
    function(e) {
      switch (e.data.method) {
        case "_raww_register":
          e.data.params.blob.text().then((blob: string) => {
            blob = blob.replace("$$$$", e.data.params.name);
            var func = `(...args) => {${blob};return ${e.data.params.name}.call({}, ...args);}`;
            funcs[e.data.params.name] = eval(func);
            (self as any).postMessage({
              jsonrpc: "2.0",
              method: "_raww_registered",
              params: {
                name: e.data.params.name
              }
            });
          });
          break;
        default:
          var fn = (funcs[e.data.method] as unknown) as Function;
          if (!fn || typeof fn !== "function") {
            throw new Error(`Cannot find method ${e.data.method}.`);
          }
          fn(...e.data.params).then(
            (result: any) => {
              (self as any).postMessage({
                jsonrpc: "2.0",
                result,
                id: e.data.id
              });
            },
            (err: Error) => {
              (self as any).postMessage({
                jsonrpc: "2.0",
                error: { code: "", message: err },
                id: e.data.id
              });
            }
          );
          break;
      }
    },
    false
  );
  (self as any).postMessage({
    jsonrpc: "2.0",
    method: "ready"
  });
};

var workerBlob = new Blob(["(", workerCode.toString(), ")();"], {
  type: "text/javascript"
});
