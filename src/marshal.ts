import { RawwWorker } from "./worker";

export class RawwMarshal {
  private static funcRegister: Map<string, Blob> = new Map<string, Blob>();
  private static idleWorkers: RawwWorker[] = [];
  private static index: number = 1;
  private static funcIndex: number = 1;
  private static rejectRegistrations: boolean = false;

  public static register(blob: Blob): string | null {
    if (this.rejectRegistrations) {
      return null;
    }

    if (!this.idleWorkers.length) {
      var worker = this.createWorker();
      if (!worker) {
        this.rejectRegistrations = true;
        return null;
      }
      this.idleWorkers.push(worker);
    }

    var name = `rawwfunc${this.funcIndex++}`;

    this.funcRegister.set(name, blob);

    this.idleWorkers.forEach(worker => {
      worker.register(name, blob);
    });

    return name;
  }

  public static exec<T>(method: string, ...params: any): Promise<T> {
    const worker = this.idleWorkers.pop() || this.createWorker();

    if (!worker) {
      // TODO: add this call to a queue
      throw new Error("Oops, run out of workers");
    }

    const promise = worker.exec<T>(method, ...params).then(
      (result: T) => {
        this.idleWorkers.push(worker);
        return result;
      },
      (reason: any) => {
        this.idleWorkers.push(worker);
        return reason;
      }
    );

    return promise;
  }

  private static createWorker(): RawwWorker | null {
    const worker = new RawwWorker(`raww${this.index++}`);
    try {
      worker.prepare();
      this.funcRegister.forEach((blob: Blob, name: string) => {
        worker.register(name, blob);
      });
    } catch (err) {
      console.log(`Failed to create worker number ${this.index - 1}`, err);
      return null;
    }
    return worker;
  }
}
