"use strict";
import { RunAsWebWorker } from './raww';

class Adder {
  constructor(){
    RunAsWebWorker(this, 'sub', {});
  }

  @RunAsWebWorker
  add(x: number, y: number) {
    return new Promise((resolve, reject) => {
      resolve(Number(x) + Number(y));
    });
  }
  
  sub = (x: number, y: number, z: number) => {
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
    const number1 = Number(num1.value);
    const number2 = Number(num2.value);
    adder.add(number1, number2)
      .then((result) => {
        answer.innerText = `${number1} plus ${number2} equals ${result}`;
      }
    );
    
    adder.sub(number1, number2, 2)
      .then((result) => {
        answer2.innerText = `${number1} minus ${number2} minus 2 equals ${result}`;
      }
    )
  },
  false
);

// adder.add = RunAsWebWorker(adder.add);
// adder.sub = RunAsWebWorker(adder.sub);