import { raww, RunAsWebWorker} from '../src/raww';

describe("#raww", () => {
  it('returns a new function from a traditional named function', () => {
    function testFn(e: any) { return new Promise<void>(() => {}); };
    const result = raww(testFn);
    expect(result).not.toBe(testFn);
    expect(() => { result();}).not.toThrow();
  });  
  
  it('returns a new function from a traditional anonymous function', () => {
    const result = raww(function (e: any) { return new Promise<void>(() => {}); });
    expect(result).toBeInstanceOf(Function);
    expect(() => { result();}).not.toThrow();
  });

  it('returns a new function from a named arrow function', () => {
    const testFn = (e: any) => { return new Promise<void>(() => {}); };
    const result = raww(testFn);
    expect(result).not.toBe(testFn);
    expect(() => { result();}).not.toThrow();
  });  
  
  it('returns a new function from an anonymous arrow function', () => {
    const result = raww((e: any) => { return new Promise<void>(() => {}); });
    expect(result).toBeInstanceOf(Function);
    expect(() => { result();}).not.toThrow();
  });  
}); 

describe("#RunAsWebWorker", () => {
  it('replaces a function with a new one returned from raww', () => {
    const testFn = (e: any) => { return new Promise<void>(() => {}); };
    const tester = { testFn };
    const result = RunAsWebWorker()(tester, 'testFn', {});
    expect(result).toBe(tester);
    expect(result.testFn).not.toBe(testFn);
  });  
})