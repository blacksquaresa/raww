import {
  functionToString,
  getDependencyConstructor,
  objectToString
} from "../src/utils";

describe("#getDependencyConstructor", () => {
  it("returns correct constructor string for a string dependency", () => {
    const result = getDependencyConstructor({
      name: "myname",
      dependency: "my dependency"
    });
    expect(result).toBe("var myname = myname_1 = 'my dependency';");
  });

  it("returns correct constructor string for a number dependency", () => {
    const result = getDependencyConstructor({ name: "myname", dependency: 42 });
    expect(result).toBe("var myname = myname_1 = 42;");
  });

  it("returns correct constructor string for a boolean dependency", () => {
    const result = getDependencyConstructor({
      name: "myname",
      dependency: true
    });
    expect(result).toBe("var myname = myname_1 = !!1;");
  });

  it("returns correct constructor string for an arrow function dependency", () => {
    const myfunc = () => {
      console.log("my func");
    };
    const result = getDependencyConstructor({
      name: "myname",
      dependency: myfunc
    });
    expect(stripWhitespace(result)).toBe(
      'var myname = myname_1 = () => { console.log("my func"); };'
    );
  });

  it("returns correct constructor string for a function dependency", () => {
    const myfunc = function() {
      console.log("my func");
    };
    const result = getDependencyConstructor({
      name: "myname",
      dependency: myfunc
    });
    expect(stripWhitespace(result)).toBe(
      'var myname = myname_1 = function () { console.log("my func"); };'
    );
  });
});

describe("#functionToString", () => {
  it("returns default for a non function", () => {
    const result = functionToString("not a function" as any);
    expect(result).toBe("function(){}");
  });

  it("returns default for a function with an overridden toString method", () => {
    const func = () => {
      var x = 1;
    };
    func.toString = () => "";
    const result = functionToString(func);
    expect(stripWhitespace(result)).toBe("function(){}");
  });

  it("returns constructor string for a function", () => {
    const func = function() {
      var x = 1;
    };
    const result = functionToString(func);
    expect(stripWhitespace(result)).toBe("function () { var x = 1; }");
  });

  it("returns constructor string for an arrow function", () => {
    const func = () => {
      var x = 1;
    };
    const result = functionToString(func);
    expect(stripWhitespace(result)).toBe("() => { var x = 1; }");
  });

  it("returns constructor string for a defined function", () => {
    function func() {
      var x = 1;
    }
    const result = functionToString(func);
    expect(stripWhitespace(result)).toBe("function func() { var x = 1; }");
  });

  it("returns constructor string for an anonymous function", () => {
    const result = functionToString(function() {
      var x = 1;
    });
    expect(stripWhitespace(result)).toBe("function () { var x = 1; }");
  });
});

describe("#objectToString", () => {
  it("returns json for a string", () => {
    const result = objectToString("not a function" as any);
    expect(result).toBe('"not a function"');
  });

  it("returns json for a number", () => {
    const result = objectToString(42 as any);
    expect(result).toBe("42");
  });

  it("returns json for a boolean", () => {
    const result = objectToString(true as any);
    expect(result).toBe("true");
  });

  it("returns json for an object with only primitives", () => {
    const result = objectToString({ name: "name", num: 42, is: true });
    expect(result).toBe('{"name":"name","num":42,"is":true}');
  });

  it("returns json for an object with an object with only primitives", () => {
    const result = objectToString({ obj: { name: "name", num: 42, is: true } });
    expect(result).toBe('{"obj":{"name":"name","num":42,"is":true}}');
  });

  it("returns json for a function", () => {
    const result = objectToString((() => {
      let x = 1;
    }) as any);
    expect(stripWhitespace(result)).toBe("() => { let x = 1; }");
  });

  it("returns json for an object with a function", () => {
    const result = objectToString({
      func: () => {
        let x = 1;
      }
    });
    expect(stripWhitespace(result)).toBe('{"func":() => { let x = 1; }}');
  });

  it("returns json for complex object with many functions", () => {
    const result = objectToString({
      func: () => {
        let x = 1;
      },
      name: "name",
      obj: {
        func: () => {
          let y = 2;
        },
        num: 42,
        obj: {
          func: function() {
            let z = 3;
          },
          is: true
        }
      }
    });
    expect(stripWhitespace(result)).toBe(
      `{"func":() => { let x = 1; },"name":"name","obj":{"func":() => { let y = 2; },"num":42,"obj":{"func":function () { let z = 3; },"is":true}}}`
    );
  });
});

function stripWhitespace(source: string): string {
  return source.replace(/[\s]+/g, " ");
}
