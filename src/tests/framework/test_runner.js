import { readFileSync } from 'fs';
import { Script, createContext } from 'vm';

// from https://stackoverflow.com/a/40560590
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    
    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        crimson: "\x1b[38m" // Scarlet
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
        crimson: "\x1b[48m"
    }
};


const header = (title) => {
    console.log(`${colors.bright}[i] ${title}`, colors.reset);
}

// simple boolean to hold if any assert failed globally.
let anyError = false;

const test = (testCase) => {

    // special case of this function to print the verdict at the end,
    // and exit with error code if there has been assertion failures.
    if (testCase === "verdict") {
        if (anyError) {
            console.log(`${colors.bright}${colors.fg.red}SOME TESTS FAILED!${colors.reset}`);
            console.log('Check log for exact details!');
            process.exit(1);
        } else {
            console.log(`${colors.bright}${colors.fg.green}All tests passed!${colors.reset}`);
            return;
        }
    }

    header(`TEST CASE: ${colors.reset}${testCase.name}`);

    // get context object prepared by the test case.
    const caseContext = testCase.context();

    // redirect VM's console.log to outer context,
    // so we can actually see it. ugly hack, but works.
    caseContext.console = {
        log: (...args) => {
            console.log(`${colors.dim} < `, ...args, colors.reset);
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
            console.log(`${colors.fg.blue} >  ${toLog}${colors.reset}`);
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
            console.log(`${colors.bright}${colors.fg.green}[+]${colors.reset} ${assert}`);
        } else {
            console.log(`${colors.bright}${colors.fg.red}[-]${colors.reset} ${assert} ${colors.bright}${colors.fg.red}<- FAILURE!${colors.reset}`);
            anyError = true;
        }
    });

    // just a newline after the testcase
    console.log("");
}

export { test };