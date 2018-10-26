"use strict";
import { RunAsWebWorker } from './raww';

class Adder {
  @RunAsWebWorker
  add(x: number, y: number) {
    return new Promise((resolve, reject) => {
      resolve(Number(x) + Number(y));
    });
  }
  
  @RunAsWebWorker
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

// adder.add = RunAsWebWorker(adder.add);
// adder.sub = RunAsWebWorker(adder.sub);