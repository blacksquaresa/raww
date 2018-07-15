# Run as Web Worker
Run a class method as a web worker. 

This library will provide a TypeScript decorator that can be used to decorate a class method to hoist its execution into a web worker. 

There are some rules:

* The method cannot reference any variables outside its own scope. 
* This includes the window object, the ```this``` keyword and any properties or methods of the containing class

### This library is still very much in development