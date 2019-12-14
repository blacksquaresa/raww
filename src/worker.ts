import { WorkerState, Indexable } from "./types";

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
  private registerQueue: Registration[] = [];

  public constructor(name: string) {
    this.name = name;
  }

  public prepare() {
    this.worker = new Worker(window.URL.createObjectURL(workerBlob), {
      name: this.name
    });
    if (!this.worker) {
      throw new Error("Failed to create a new worker");
    }

    this.worker.addEventListener("message", this.act.bind(this), false);
    this.worker.addEventListener("messageerror", this.err.bind(this), false);
  }

  private act(e: MessageEvent) {
    if (e.data.method === "ready") {
      this.processRegistrationQueue();
      this.state = WorkerState.Idle;
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

  private processRegistrationQueue() {
    this.registerQueue.forEach(registration => {
      this.register(registration.name, registration.blob);
    });
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
    if (!this.worker || this.state === WorkerState.Preparing) {
      this.registerQueue.push({ name, blob: fn });
      return;
    }

    this.state = WorkerState.Updating;
    this.worker.postMessage({
      jsonrpc: "2.0",
      method: "_raww_register",
      params: {
        name: name,
        blob: fn
      }
    });
    this.state = WorkerState.Idle;
  }

  public exec<T>(method: string, ...params: any): Promise<T> {
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
            var func = `(...args) => {${blob};${e.data.params.name}.call({}, ...args);}`;
            funcs[e.data.params.name] = eval(func);
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
