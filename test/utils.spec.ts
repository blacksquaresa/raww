import { getDependencyConstructor } from '../src/utils';

describe("#getDependencyConstructor", () => {
  it('returns correct constructor string for a string dependency', () => {
    const result = getDependencyConstructor({ name:'myname', dependency: 'my dependency' });
    expect(result).toBe("const myname = 'my dependency';");
  });
  
  it('returns correct constructor string for a number dependency', () => {
    const result = getDependencyConstructor({ name:'myname', dependency: 42 });
    expect(result).toBe("const myname = 42;");
  });

  it('returns correct constructor string for a boolean dependency', () => {
    const result = getDependencyConstructor({ name:'myname', dependency: true });
    expect(result).toBe("const myname = !!1;");
  });
  
  it('returns correct constructor string for a function dependency', () => {
    const myfunc = () => { console.log('my func'); };
    const result = getDependencyConstructor({ name:'myname', dependency: myfunc });
    expect(result).toBe("const myname = () => { console.log('my func'); };");
  });
});