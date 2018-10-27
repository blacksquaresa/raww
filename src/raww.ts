type Func<T> = (...args: any[]) => Promise<T>;
type ResponseObject = { result?: any, error?: any };

export function RunAsWebWorker(target: any, propertyKey: string, descriptor: PropertyDescriptor): any {
  target[propertyKey] = raww(target[propertyKey]);
  return target;
}

export function raww<T>(fn: Func<T>): Func<T> {
  if(fn == null || typeof(fn) !== 'function')  {
    return fn;
  }
  const workerCode = () => {
    self.addEventListener("message",
      function(e) {
        $$$$(...e.data)
        .then((result) => {
          (self as any).postMessage({ result });
        }, (err) => {
          (self as any).postMessage({ error: err});
        });
      },
      false
    );
  };
  function $$$$(...data: any[]): Promise<T> {
    return (fn).call({}, ...data);
  }
  const workerBlob = new Blob(    
    [`${$$$$.toString().replace('fn', functionToString(fn))};`, "(", workerCode.toString(), ")();"], 
    { type: "text/javascript" }
  );
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
        reject('an unserialisable response has been received');
      }
      worker.addEventListener("message", act, false);
      worker.addEventListener("messageerror", err, false);
      worker.postMessage(args);
   });
  }
  return replaceFunction;
}

const functionToString = (fn: Function): string => {
  const fnString = fn.toString();
  return fnString.startsWith('(') || fnString.startsWith('function') ? fnString : `function ${fnString}`;
}