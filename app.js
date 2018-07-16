const workerCode = () => {
    function add(x, y){
        return Number(x)+Number(y);
    }
    
    self.addEventListener('message', function(e) {
        let result = add(e.data.x, e.data.y);
        self.postMessage(result);
      }, false);
}
const workerBlob = new Blob(['(', workerCode.toString(), ')();'], { type: 'text/javascript' });

let num1 = document.getElementById('num1');
let num2 = document.getElementById('num2');
let equals = document.getElementById('equals');
let answer = document.getElementById('answer');
let worker = new Worker(window.URL.createObjectURL(workerBlob));

worker.addEventListener('message', function(e) {
    answer.innerText = e.data;
  }, false);

equals.addEventListener('click', () => {
    worker.postMessage({ x: Number(num1.value), y: Number(num2.value)});
}, false);

