context("Function Types", () => {
  const paths = ["functionTypes/simpleFunction.html"];

  paths.forEach(path => {
    it(`Load basic function types from ${path}`, () => {
      cy.visit(`./test/integration/${path}`);
      cy.contains(/Doing something from worker: raww\d+/);
    });
  });
});
