import { Script, createContext } from 'vm';

// this is a very ugly hack to redirect console.log messages
// from inside the context to the outer context.
// without this, we wouldn't see any output.
let contextObj = {
	console: {
	    log: (...args) => {
	        console.log(...args);
	    }
	}
};

const vmContext = createContext(contextObj);
const script = new Script("console.log('hello from the other side');");
script.runInContext(vmContext);