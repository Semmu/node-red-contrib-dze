// get current date in a timestamp of millisec.
const before = Date.now();

// parameters to fine-tune the silly and slow recursive function below.
const depth = 8;
const size = 7;

// counter to keep track how many times we called the recursive function.
let calledCount = 0;

// silly busy-wait function.
// runtime is O(h no) computation-wise, so we can use it to spend some time
// berween calling Date.now() two times.
function slowDown(depth) {
    calledCount++;
    if (depth <= 1) {
        return Math.random(); // on depth==1 we just return a random (0-1) float.
    } else {
        return Array.from({   // if depth > 1, we create new array
            length: size      // of 'size' length.
            }, (v, i) => (
                slowDown(depth-1)   // assign each item the value of slowDown(depth-1),
            )                       // making it a recursive function.
        ).reduce(
            (acc, curr) => (
                Math.sqrt(acc+curr) // compute one single value using floating point math
            )                       // which is "slow".
        );
    }
}

// actually call the function, should take some time.
const res = slowDown(depth);

// get current date in a timestamp of millisec, again.
const after = Date.now();

// calculate time spent calling the recursive function.
const timeSpent = after - before;