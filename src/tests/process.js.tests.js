import { Flow, Node, EmptyMsg, AlwaysTheSameDate } from './framework/node-red_api_mocks.js';
import { test } from './framework/test_runner.js';

test({
    name: "it does nothing by default",
    context: () => {
        return {
            flow: new Flow(),
            node: new Node(),
            msg: new EmptyMsg(),
        }
    },
    run: 'src/process.js',
    asserts: [
        'JSON.stringify(flow.data)  === "{}"',
        'JSON.stringify(node.warns) === "[]"',
        'JSON.stringify(node.sends) === "[[[],{}]]"',
        'JSON.stringify(config.automations) === "[]"',
        'JSON.stringify(config.timers) === "[]"',
        'node.isDone === true',
    ]
});

test({
    name: "context print example",
    context: () => {

        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);

        return { flow, node, msg };
    },
    run: 'src/process.js',
    log: [
        'config',
        'msg',
        'flow',
        'node',
        '1 == 1',
        '"any " + ("yrartibra".split("").reverse().join("-") + " C0D3")'
    ],
    asserts: [
        "JSON.stringify(flow.data)  === '{\"dzeDebug\":true}'",
        "JSON.stringify(node.warns) === '[\"[DZE] processing Zigbee message:\",{\"topic\":\"zigbee2mqtt/SomeDevice\",\"payload\":{}},\"[DZE] done with checking automations! sending result messages:\",[]]'",
        'JSON.stringify(node.sends) === "[[[],{}]]"',
        'JSON.stringify(config.automations) === "[]"',
        'JSON.stringify(config.timers) === "[]"',
        'node.isDone === true',
    ]
});

test({
    name: "it prints debug messages if enabled",
    context: () => {

        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);

        return { flow, node, msg };
    },
    run: 'src/process.js',
    asserts: [
        "JSON.stringify(flow.data)  === '{\"dzeDebug\":true}'",
        "JSON.stringify(node.warns) === '[\"[DZE] processing Zigbee message:\",{\"topic\":\"zigbee2mqtt/SomeDevice\",\"payload\":{}},\"[DZE] done with checking automations! sending result messages:\",[]]'",
        'JSON.stringify(node.sends) === "[[[],{}]]"',
        'JSON.stringify(config.automations) === "[]"',
        'JSON.stringify(config.timers) === "[]"',
        'node.isDone === true',
    ]
});

test({
    name: "it does not create new global variables from the message payload when the message topic does not match",
    context: () => {
        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);
        flow.set('dzeConfig', {
            base_topic: 'zigbee2mqtt',
            automations: [{
                when: 'OtherDevice',
                condition: true,
                send: {
                    some: 'thing'
                },
                to: 'Target'
            }],
            timers: [],
        });

        msg.payload = {
            toBeGlobal: "i am injected"
        }

        return { flow, node, msg };
    },
    run: 'src/process.js',
    asserts: [
        'typeof toBeGlobal === "undefined"',
        'JSON.stringify(config.timers) === "[]"',
        'node.isDone === true',
    ]
});

test({
    name: "it does not create new global variables from the message payload if there is no condition",
    context: () => {
        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);
        flow.set('dzeConfig', {
            base_topic: 'zigbee2mqtt',
            automations: [{
                when: 'SomeDevice',
                send: {
                    some: 'thing'
                },
                to: 'Target'
            }],
            timers: [],
        });

        msg.payload = {
            toBeGlobal: "i am injected"
        }

        return { flow, node, msg };
    },
    run: 'src/process.js',
    asserts: [
        'typeof toBeGlobal === "undefined"',
        'JSON.stringify(config.timers) === "[]"',
        'node.isDone === true',
    ]
});

test({
    name: "it creates new global variables from the message payload if needed",
    context: () => {
        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);
        flow.set('dzeConfig', {
            base_topic: 'zigbee2mqtt',
            automations: [{
                when: 'SomeDevice',
                condition: true,
                send: {
                    some: 'thing'
                },
                to: 'Target'
            }],
            timers: [],
        });

        msg.payload = {
            toBeGlobal: "i am injected"
        }

        return { flow, node, msg };
    },
    run: 'src/process.js',
    asserts: [
        'toBeGlobal === "i am injected"',
        'JSON.stringify(config.timers) === "[]"',
        'node.isDone === true',
    ]
});

test({
    name: "it reacts to matching messages if no condition is set",
    context: () => {
        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);
        flow.set('dzeConfig', {
            base_topic: 'zigbee2mqtt',
            automations: [{
                when: 'SomeDevice',
                send: {
                    some: 'thing'
                },
                to: 'Target'
            }],
            timers: [],
        });

        msg.payload = {
            toBeGlobal: "i am injected"
        }

        return { flow, node, msg };
    },
    run: 'src/process.js',
    asserts: [
        'JSON.stringify(config.timers) === "[]"',
        "JSON.stringify(node.sends) === '[[[{\"topic\":\"zigbee2mqtt/Target/set\",\"payload\":{\"some\":\"thing\"}}],{}]]'",
        'node.isDone === true',
    ]
});

test({
    name: "it does not react to matching messages if the condition evaluates to false",
    context: () => {
        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);
        flow.set('dzeConfig', {
            base_topic: 'zigbee2mqtt',
            automations: [{
                when: 'SomeDevice',
                condition: false,
                send: {
                    some: 'thing'
                },
                to: 'Target'
            }],
            timers: [],
        });

        msg.payload = {
            toBeGlobal: "i am injected"
        }

        return { flow, node, msg };
    },
    run: 'src/process.js',
    asserts: [
        'JSON.stringify(config.timers) === "[]"',
        "JSON.stringify(node.sends) === '[[[],{}]]'",
        'node.isDone === true',
    ]
});

test({
    name: "it reacts to matching messages with fulfilled conditions #1",
    context: () => {
        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);
        flow.set('dzeConfig', {
            base_topic: 'zigbee2mqtt',
            automations: [{
                when: 'SomeDevice',
                condition: "numeric > 50",
                send: {
                    some: 'thing'
                },
                to: 'Target'
            }],
            timers: [],
        });

        msg.payload = {
            numeric: "51"
        }

        return { flow, node, msg };
    },
    run: 'src/process.js',
    asserts: [
        'JSON.stringify(config.timers) === "[]"',
        "JSON.stringify(node.sends) === '[[[{\"topic\":\"zigbee2mqtt/Target/set\",\"payload\":{\"some\":\"thing\"}}],{}]]'",
        'node.isDone === true',
    ]
});

test({
    name: "it reacts to matching messages with fulfilled conditions #2",
    context: () => {
        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);
        flow.set('dzeConfig', {
            base_topic: 'zigbee2mqtt',
            automations: [{
                when: 'SomeDevice',
                condition: 'action == "single"',
                send: {
                    some: 'thing'
                },
                to: 'Target'
            }],
            timers: [],
        });

        msg.payload = {
            action: 'single'
        }

        return { flow, node, msg };
    },
    run: 'src/process.js',
    asserts: [
        'JSON.stringify(config.timers) === "[]"',
        "JSON.stringify(node.sends) === '[[[{\"topic\":\"zigbee2mqtt/Target/set\",\"payload\":{\"some\":\"thing\"}}],{}]]'",
        'node.isDone === true',
    ]
});

test({
    name: "it does not react to matching messages with failing conditions #1",
    context: () => {
        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);
        flow.set('dzeConfig', {
            base_topic: 'zigbee2mqtt',
            automations: [{
                when: 'SomeDevice',
                condition: "numeric > 50",
                send: {
                    some: 'thing'
                },
                to: 'Target'
            }],
            timers: [],
        });

        msg.payload = {
            numeric: "49"
        }

        return { flow, node, msg };
    },
    run: 'src/process.js',
    asserts: [
        'JSON.stringify(config.timers) === "[]"',
        "JSON.stringify(node.sends) === '[[[],{}]]'",
        'node.isDone === true',
    ]
});

test({
    name: "it does not react to matching messages with failing conditions #2",
    context: () => {
        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);
        flow.set('dzeConfig', {
            base_topic: 'zigbee2mqtt',
            automations: [{
                when: 'SomeDevice',
                condition: 'action == "single"',
                send: {
                    some: 'thing'
                },
                to: 'Target'
            }],
            timers: [],
        });

        msg.payload = {
            action: 'double'
        }

        return { flow, node, msg };
    },
    run: 'src/process.js',
    asserts: [
        'JSON.stringify(config.timers) === "[]"',
        "JSON.stringify(node.sends) === '[[[],{}]]'",
        'node.isDone === true',
    ]
});

test({
    name: "it can access trigger message attributes and use them to compute arbitrary payload to send",
    context: () => {
        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);
        flow.set('dzeConfig', {
            base_topic: 'zigbee2mqtt',
            automations: [{
                when: 'SomeDevice',
                condition: 'action == "single"',
                send: '{ forwarded_computed: (numeric*2+10), forwarded_conditional: (action == "single" ? "one" : "two") }',
                to: 'Target'
            }],
            timers: [],
        });

        msg.payload = {
            action: "single",
            numeric: 50,
        }

        return { flow, node, msg };
    },
    run: 'src/process.js',
    asserts: [
        'JSON.stringify(config.timers) === "[]"',
        "JSON.stringify(node.sends) === '[[[{\"topic\":\"zigbee2mqtt/Target/set\",\"payload\":{\"forwarded_computed\":110,\"forwarded_conditional\":\"one\"}}],{}]]'",
        'node.isDone === true',
    ]
});

test({
    name: "it sends multiple messages on multiple matches",
    context: () => {
        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);
        flow.set('dzeConfig', {
            base_topic: 'zigbee2mqtt',
            automations: [{
                when: 'SomeDevice',
                condition: 'action == "single"',
                send: '{ first: "message" }',
                to: 'Target'
            }, {
                when: 'SomeDevice',
                condition: 'numeric == 50',
                send: '{ second: "message" }',
                to: 'Target'
            }],
            timers: [],
        });

        msg.payload = {
            action: "single",
            numeric: 50,
        }

        return { flow, node, msg };
    },
    run: 'src/process.js',
    asserts: [
        'JSON.stringify(config.timers) === "[]"',
        "JSON.stringify(node.sends) === '[[[{\"topic\":\"zigbee2mqtt/Target/set\",\"payload\":{\"first\":\"message\"}},{\"topic\":\"zigbee2mqtt/Target/set\",\"payload\":{\"second\":\"message\"}}],{}]]'",
        'node.isDone === true',
    ]
});

test({
    name: "it correctly checks conditions, not just topics",
    context: () => {
        const flow = new Flow();
        const node = new Node();
        const msg = new EmptyMsg();

        flow.set('dzeDebug', true);
        flow.set('dzeConfig', {
            base_topic: 'zigbee2mqtt',
            automations: [{
                when: 'SomeDevice',
                condition: 'action == "single"',
                send: '{ first: "message" }',
                to: 'Target'
            }, {
                when: 'SomeDevice',
                condition: 'numeric == "not50"',
                send: '{ second: "message" }',
                to: 'Target'
            }],
            timers: [],
        });

        msg.payload = {
            action: "single",
            numeric: 50,
        }

        return { flow, node, msg };
    },
    run: 'src/process.js',
    asserts: [
        'JSON.stringify(config.timers) === "[]"',
        "JSON.stringify(node.sends) === '[[[{\"topic\":\"zigbee2mqtt/Target/set\",\"payload\":{\"first\":\"message\"}}],{}]]'",
        'node.isDone === true',
    ]
});

// print verdict, special case of this function
test("verdict");