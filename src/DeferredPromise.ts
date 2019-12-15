export class DeferredPromise implements Promise<void> {
  private promise: Promise<void>;
  private resolveFunc?: () => void;
  private rejectFunc?: () => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolveFunc = resolve;
      this.rejectFunc = reject;
    });
  }

  public then<TResult1 = void, TResult2 = never>(
    onfulfilled?: (value: void) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  public catch<TResult = never>(
    onrejected?: (reason: any) => TResult | PromiseLike<TResult>
  ): Promise<void | TResult> {
    return this.promise.catch(onrejected);
  }

  public resolve(): void {
    this.resolveFunc!();
  }

  public reject(): void {
    this.rejectFunc!();
  }

  [Symbol.toStringTag]: string;
}
