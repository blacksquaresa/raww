function add(x, y){
    return Number(x)+Number(y);
}

self.addEventListener('message', function(e) {
    let result = add(e.data.x, e.data.y);
    self.postMessage(result);
  }, false);