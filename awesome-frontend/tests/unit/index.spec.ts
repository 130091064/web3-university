const sum = (a: number, b: number) => a + b;

test("sum works", () => {
  expect(sum(1, 2)).toBe(3);
});
