Candidate Name: ***REMOVED*** ***REMOVED***

Tasks: 2.

Time: [To be completed]

Notes:
[Explain your approach and anything particular of note in your solution]
- Keen to stick to TDD principles so I'm going to start by adding a test directory and writing a failing test that I can then make pass.
- I'm going to commit every time I've followed the red-green-refactor pattern.
- I'm also going to use Jest with TypeScript as my test runner for the Koa server as I have knowledge of Jests API and capabilities. Took some minor setup to work with TS. (Thanks to https://dev.to/muhajirdev/unit-testing-with-typescript-and-jest-2gln)
- Was experiencing an open issue where @types/jest and jest versions beyond 24.0.0 result in TypeScript errors. Fixed by pinning versions (see here: https://github.com/facebook/jest/issues/8285)
- First I'm setting a slightly cleaner architecture for the Koa server, by extracting out 'routes' into it's own file and importing this
- I'm also creating a config file to allow me to more easily setup extra config in the future.
- Next I'm going to have add a method to the data.ts file to extract out data. I'm going to write a failing test for this first.
- Created a test for the successful read of data
- Opted to use async/await because it's clean ES6 syntax
- In the actual implementation I convert the callback based API of SQLite3 into using native Promises which can be awaited.
