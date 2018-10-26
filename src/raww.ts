type Func<T> = (...args: any[]) => Promise<T>;
const $$$$: Func<void> = (e) => { return new Promise<void>(() => {}); };
let counter = 1;

export function RunAsWebWorker(target: any, propertyKey: string, descriptor: PropertyDescriptor): any {
  target[propertyKey] = raww(target[propertyKey], propertyKey);
  return target;
}

export function raww<T>(fn: Func<T>, name?: string): Func<T> {
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
  const checkedName = name || fn.name || `anonymous${counter++}`;
  const workerBlob = new Blob(    
    [`function ${fn.toString()};`, "(", workerCode.toString().replace(/\$\$\$\$/, checkedName), ")();"], 
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