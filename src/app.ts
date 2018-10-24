"use strict";
type Func<T> = (...args: any[]) => Promise<T>;
const $$$$: Func<void> = (e) => { return new Promise<void>(() => {}); };
let counter = 1;

function RunAsWebWorker<T>(fn: Func<T>, name?: string): Func<T> {
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

class Adder {
  add(x: number, y: number) {
    return new Promise((resolve, reject) => {
      resolve(Number(x) + Number(y));
    });
  }
  sub(x: number, y: number, z: number) {
    return new Promise((resolve, reject) => {
      resolve(Number(x) - Number(y)- z);
    });
  }
}

let num1: HTMLInputElement = document.getElementById("num1") as HTMLInputElement || new HTMLInputElement();
let num2: HTMLInputElement = document.getElementById("num2") as HTMLInputElement || new HTMLInputElement();
let equals: HTMLElement = document.getElementById("equals") || new HTMLElement();
let answer: HTMLElement = document.getElementById("answer") || new HTMLElement();
let answer2: HTMLElement = document.getElementById("answer2") || new HTMLElement();
const adder = new Adder();

equals.addEventListener(
  "click",
  () => {
    adder.add(Number(num1.value), Number(num2.value))
      .then((result) => {
        answer.innerText = result.toString();
      }
    );
    
    adder.sub(Number(num1.value), Number(num2.value), 2)
      .then((result) => {
        answer2.innerText = result.toString();
      }
    )
  },
  false
);

adder.add = RunAsWebWorker(adder.add);
adder.sub = RunAsWebWorker(adder.sub);