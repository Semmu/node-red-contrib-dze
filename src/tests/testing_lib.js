import { readFileSync } from 'fs';
import { Script, createContext } from 'vm';

const header = (title) => {
    console.log(`# ${title}`);
}

const item = (name) => {
    console.log(`- ${name}`);
}

const test = (testCase) => {

    header(`TEST CASE: ${testCase.name}`);

    // get context object prepared by the test case.
    const caseContext = testCase.context();

    // redirect VM's console.log to outer context,
    // so we can actually see it. ugly hack, but works.
    caseContext.console = {
        log: (...args) => {
            console.log(...args);
        }
    }

    // create dedicated VM context to run the code in.
    const vmContext = createContext(caseContext);

    // read file to run and "compile" it.
    const code = readFileSync(testCase.run, 'utf-8');
    const script = new Script(code);

    // run code in separated VM context.
    script.runInContext(vmContext);

    // log any stuff we're interested in.
    if (testCase.log) {

        header("CONTEXT DATA");

        testCase.log.forEach((toLog) => {
            // we log each item as its expression
            item(`${toLog}`);
            // and we run a console.log inside the VM context,
            // so we get the actual output (redirected to us).
            const logScript = new Script(`console.log(${toLog})`);
            logScript.runInContext(vmContext);
        });
    }

    header("CHECKING ASSERTIONS");

    // we iterate over the assertions list
    testCase.asserts.forEach((assert) => {
        // we run them inside the VM context,
        // then check the last expression's return value,
        // which should be always `true`.
        // if it is not, we exit immediately.
        const assertCode = `(${assert});`;
        const assertScript = new Script(assertCode);
        const res = assertScript.runInContext(vmContext);
        if (res) {
            item(`${assert} -> OK!`);
        } else {
            console.log("!!! ASSERTION FAILURE!!!");
            console.log(`(${assert}) -> false`);
            process.exit(1);
        }
    });

    // just a newline after the testcase
    console.log("");
}

export { test };