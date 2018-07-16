class Adder {
  add(x, y) {
    return new Promise((resolve, reject) => {
      resolve(Number(x) + Number(y));
    });
  }
  sub(x, y, z) {
    return new Promise((resolve, reject) => {
      resolve(Number(x) - Number(y)- z);
    });
  }
}

let num1 = document.getElementById("num1");
let num2 = document.getElementById("num2");
let equals = document.getElementById("equals");
let answer = document.getElementById("answer");
let answer2 = document.getElementById("answer2");
const adder = new Adder();

equals.addEventListener(
  "click",
  () => {
    adder.add(Number(num1.value), Number(num2.value))
      .then((result) => {
        answer.innerText = result;
      }
    );
    
    adder.sub(Number(num1.value), Number(num2.value), 2)
      .then((result) => {
        answer2.innerText = result;
      }
    )
  },
  false
);

function runAsWorker(obj, param) {
  const fn = obj[param];
  if(typeof(fn) !== 'function')  {
    return;
  }
  const workerCode = () => {
    self.addEventListener("message",
      function(e) {
        $$$$(...e.data)
        .then((result) => {
          self.postMessage(result);
        });
      },
      false
    );
  };
  const workerBlob = new Blob(    
    [`function ${fn.toString()};`, "(", workerCode.toString().replace(/\$\$\$\$/, param), ")();"], 
    { type: "text/javascript" }
  );
  let worker = new Worker(window.URL.createObjectURL(workerBlob));

  const replaceFn = (...args) => {  
    return new Promise((resolve, reject) => {
      const act = (e) => {        
        worker.removeEventListener("message", act);
        resolve(e.data);
      }
      worker.addEventListener("message", act, false);
      worker.postMessage(args);
   });
  }
  obj[param] = replaceFn;
}

runAsWorker(adder, 'add');
runAsWorker(adder, 'sub');