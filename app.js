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
equals.onclick = () => {
    answer.innerText = window.adder.add(Number(num1.value), Number(num2.value));
}