const $$$$: (...e: any[]) => Promise<void> = (e) => Promise.resolve();

export function RunAsWebWorker(obj: any, param: string) {
  if(!obj.hasOwnProperty(param)){
    return;
  };
  const fn = obj[param];
  if(typeof(fn) !== 'function')  {
    return;
  }
  const workerCode = () => {
    self.addEventListener("message",
      function(e) {
        $$$$(...e.data)
        .then((result) => {
          self.postMessage(result, '*');
        });
      },
      false
    );
  };
  const workerBlob = new Blob(    
    [`function ${fn.toString()};`, "(", workerCode.toString().replace(/\$\$\$\$/, param.toString()), ")();"], 
    { type: "text/javascript" }
  );
  let worker = new Worker(window.URL.createObjectURL(workerBlob));

  const replaceFn = (...args: any[]) => {  
    return new Promise((resolve, reject) => {
      const act = (e: any) => {        
        worker.removeEventListener("message", act);
        resolve(e.data);
      }
      worker.addEventListener("message", act, false);
      worker.postMessage(args);
   });
  }
  obj[param] = replaceFn;
}