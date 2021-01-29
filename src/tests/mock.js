// simple mock interface for the shared flow context in Node-RED.
function Flow() {
    this.data = {};

    this.set = (id, value) => {
        this.data[id] = value;    
    }

    this.get = (id) => {
        if (id in this.data) {
            return this.data[id];
        } else {
            return undefined;
        }
    }

    // probably unnecessary.
    this.__reset = () => {
        this.data = {};
    }

    return this;
}

// simple mock interface for the used `node` methods in Node-RED.
function Node() {
    this.warns = [];
    this.warn = (msg) => {
        this.warns.push(msg);
    };

    this.sends = [];
    this.send = (msg) => {
        this.sends.push(msg);
    };

    this.isDone =  false;
    this.done = () => {
        this.isDone = true;
    };

    // probably unnecessary.
    this.__reset = () => {
        this.warns = [];
        this.sends = [];
        this.isDone = false;
    };

    return this;
};

// simple helper function to construct empty messages.
function EmptyMsg() {
    // this is supposed to be a safe cloning mechanism,
    // not sure if needed or not.
    return Object.assign({
        topic: 'zigbee2mqtt/SomeDevice',
        payload: {}
    }, {});
}

// storing current date as a timestamp.
const a_timestamp = Date.now();

// static mock for Date, always returns the same value, good for testing.
const AlwaysTheSameDate = {
    now: () => (a_timestamp)
};

export { Flow, Node, EmptyMsg, AlwaysTheSameDate };