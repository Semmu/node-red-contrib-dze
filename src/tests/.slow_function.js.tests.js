import { AlwaysTheSameDate } from './framework/node-red_api_mocks.js';
import { test } from './framework/test_runner.js';

test({
    name: "the date testing file takes a little time to run",
    context: () => ({}),
    run: 'src/.slow_function.js',
    asserts: [
        'calledCount > 0',
        'timeSpent > 0'
    ]
});

test({
    name: "the date testing file takes a little time to run, but mocking also works",
    context: () => ({
        Date: AlwaysTheSameDate
    }),
    run: 'src/.slow_function.js',
    asserts: [
        'calledCount > 0',
        'timeSpent == 0'
    ]
});

// print verdict, special case of this function
test("verdict");