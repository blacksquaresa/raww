type Func<T> = (...args: any[]) => Promise<T>;

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
          (self as any).postMessage(result);
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
      const act = (e: any) => {        
        worker.removeEventListener("message", act);
        resolve(e.data);
      }
      worker.addEventListener("message", act, false);
      worker.postMessage(args);
   });
  }
  return replaceFunction;
}

const functionToString = (fn: Function): string => {
  const fnString = fn.toString();
  return fnString.startsWith('(') || fnString.startsWith('function') ? fnString : `function ${fnString}`;
}