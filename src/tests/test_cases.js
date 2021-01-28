import { Flow, Node, EmptyMsg } from './mock.js';
import { test } from './testing_lib.js';

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
        'JSON.stringify(node.sends) === "[]"',
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
        "JSON.stringify(node.warns) === '[\"[DZE] processing Zigbee message:\",{\"topic\":\"zigbee2mqtt/SomeDevice\",\"payload\":{}}]'",
        'JSON.stringify(node.sends) === "[]"',
        'JSON.stringify(config.automations) === "[]"',
        'JSON.stringify(config.timers) === "[]"',
        'node.isDone === true',
    ]
});

test({
    name: "it does not create new global variables from the message payload the message does not match",
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
    name: "it reacts to matching messages",
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
        "JSON.stringify(node.sends) === '[{\"topic\":\"zigbee2mqtt/Target/set\",\"payload\":{\"some\":\"thing\"}}]'",
        'node.isDone === true',
    ]
});

test({
    name: "it reacts to matching messages with fulfilled condition #1",
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
        "JSON.stringify(node.sends) === '[{\"topic\":\"zigbee2mqtt/Target/set\",\"payload\":{\"some\":\"thing\"}}]'",
        'node.isDone === true',
    ]
});

test({
    name: "it reacts to matching messages with fulfilled condition #2",
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
        "JSON.stringify(node.sends) === '[{\"topic\":\"zigbee2mqtt/Target/set\",\"payload\":{\"some\":\"thing\"}}]'",
        'node.isDone === true',
    ]
});

test({
    name: "it does not react to matching messages with failing condition #1",
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
        "JSON.stringify(node.sends) === '[]'",
        'node.isDone === true',
    ]
});

test({
    name: "it does not react to matching messages with failing condition #2",
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
        "JSON.stringify(node.sends) === '[]'",
        'node.isDone === true',
    ]
});

test({
    name: "it can access trigger message attributes and compute arbitrary payload to send",
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
        "JSON.stringify(node.sends) === '[{\"topic\":\"zigbee2mqtt/Target/set\",\"payload\":{\"forwarded_computed\":110,\"forwarded_conditional\":\"one\"}}]'",
        'node.isDone === true',
    ]
});