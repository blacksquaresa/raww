"use strict";
import { RunAsWebWorker } from '../src/raww';
import * as _ from 'lodash';

const func1 = () => { console.log('Function 1'); };
const func2 = function () { console.log('Function 2'); };
function func3(){ console.log('Function 3'); }

class Adder {
  constructor(){
    RunAsWebWorker()(this, 'sub', {});
  }

  @RunAsWebWorker({ myString: 'myString', myNumber: 42, myBool: true }, { func1, func2, func3 }, {_})
  add(x: number, y: number) {
    return new Promise((resolve, reject) => {
      const result = _.reduce([x, y],(t:number, x:number) => t+x, 0);
      resolve(result);
    });
  }
  
  sub = (x: number, y: number, z: number) => {
    return new Promise((resolve, reject) => {
      resolve(Number(x) - Number(y)- z);
    });
  }

  @RunAsWebWorker()
  error(message: string) {
    return new Promise((resolve, reject) => {
      reject(message);
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
    );

    adder.error('testing an error')
         .catch((reason: string) => {
           console.log(reason);
         });
  },
  false
);