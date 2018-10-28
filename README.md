# Run as Web Worker
Run a pure function as a web worker. 

This library will provide a method that hoists your function into a web worker, and returns a new function, with the same signature, that you can use to call it. You can use the new function interchangeably with the original in your code.

For TypeScript users we also include a decorator you can use to decorate a class method to run it in a web worker. Everything else about your code can run exactly the same way.  

There are some rules:

* The method cannot reference any variables outside its own scope, including the window object, the ```this``` keyword and any properties or methods of the containing class or object.
* The method must return a Promise (or, technically, a Thenable object). All requests to web workers are asynchronous, so your method must be asynchronous too. 
* All parameters passed into the method must be serialisable to a string. 
* Any parameters passed in by reference will lose their reference. You cannot make changes to these objects and expect those changes to persist outside of the function.

## Installation

Using npm:
``` 
npm install run-as-web=worker
```
Using yarn:
```
yarn add run-as-web-worker
```

## Usage

The simplest use is to replace a method:
``` javascript
import { raww } from 'run-as-web-worker';
function myFunc(){
    return new Promise((resolve, reject) => {
        resolve('all done');
    });
}

const myFuncInWebWorker = raww(myFunc);

myFuncInWebWorker().then((result) => {
    console.log(result);
});
```

You can replace the method on an object, then just keep using that object like before:
``` javascript
import { raww } from 'run-as-web-worker';
const myObject = {
    someProp: 'some property',
    myFunc: () => {
        return new Promise((resolve, reject) => {
            resolve('all done');
        });
    }
};

myObject.myFunc = raww(myObject.myFunc);

myObject.myFunc().then((result) => {
    console.log(result);
});
```

You can do the same thing inline:
``` javascript
import { raww } from 'run-as-web-worker';
const myObject = {
    someProp: 'some property',
    myFunc: raww(() => {
        return new Promise((resolve, reject) => {
            resolve('all done');
        });
    })
};

myObject.myFunc().then((result) => {
    console.log(result);
});
```

You can replace class methods as well:
``` javascript
import { raww } from 'run-as-web-worker';
class myClass {
    myFunc() {
        return new Promise((resolve, reject) => {
            resolve('all done');
        });
    }
};

const instance = new myClass();
instance.myFunc = raww(instance.myFunc);

instance.myFunc().then((result) => {
    console.log(result);
});
```

If you use TypeScript, we have a decorator you can use:
``` typescript
import { RunAsWebWorker } from 'run-as-web-worker';
class myClass {
    public someProp: string =  'some property';

    @RunAsWebWorker
    public myFunc(): Promise<string> {
        return new Promise((resolve: Function, reject: Function) => {
            resolve('all done');
        });
    }
}

const instance = new myClass();
instance.myFunc().then((result: string) => {
    console.log(result);
});
```