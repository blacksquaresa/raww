class Adder{
    add(x, y){
        return x+y;
    }
}

window.adder = new Adder();
let num1 = document.getElementById('num1');
let num2 = document.getElementById('num2');
let equals = document.getElementById('equals');
let answer = document.getElementById('answer');
let worker = new Worker('worker.js');

worker.addEventListener('message', function(e) {
    answer.innerText = e.data;
  }, false);

equals.addEventListener('click', () => {
    worker.postMessage({ x: Number(num1.value), y: Number(num2.value)});
}, false);