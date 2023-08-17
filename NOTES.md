Candidate Name: Erin Eland

Tasks: 2.

Time: A little extra than asked, 3 or so hours for task 2 and 2 or so on task 3, I want to make a good impression!

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
- Opted to use async/await because it's clean ES6 syntax and supports awaiting promises, vastly improving readability.
- In the actual implementation I convert the callback based API of SQLite3 into using native Promises which can be awaited.
- Also setting up a test watch command so that every time I update a test or implementation the tests are automatically re-run.
- Now I am going to set up the route in Koa, and test it using Supertest. I've not used Koa before but will try to use what I know of Express.
- Going to forgo setting up Nock for now, this would be an improvement I make later.
- Writing a test to write the data into the database via a POST endopint, and asserting it worked by directly querying the in-memory database to find my inserted record.
- This will first require me extending the data layer with a test and method.
- Now I've added a failing test for the POST endpoint
- Implementing the endpoint now, and adding Koa Bodyparser along with it's Type definitions
- Now I'm on task 3, I've fleshed out a basic approach with a pen and paper, and am now writing a failing test to call the the as yet non-existent endpoint and expect an array back.
- Now onto implementing the method on the data model, then exposing it via an API endpoint.
- Did this via a simple algorithm:
1. Find the last day of the current record's month
2. Find the next reading
3. Find the number of days between the 2 readings
4. Find the difference in meter readings between the previous and next reading.
5. Find the average daily usage via energyUsedBetweenReadings /noOfDaysBetweenReadings
6. If the current reading date is the end of the month, set the reading as the estimate for the end of the month.
7. Otherwise find the days between the current reading's reading date and end of reading's month
8. Find ADDITIONAL the amount of energy usage to add to the current reading, to get end of month usage
9. Now calculate the estimated reading at the end of the month of the current reading.
10. Then iterate and calculate the monthly usages using the above estimates!
