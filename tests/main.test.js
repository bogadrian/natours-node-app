// JEST testing file - example here. set a function with an expected output. Jest will check if the output will be correct. ex const res = 2 === 2; expect(res).toBe(2)
test('Hello World', () => {});

test('This one shuold fail', () => {
  throw new Error('Failure');
});
