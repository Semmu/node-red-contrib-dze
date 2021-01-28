// read active DZE configuration, or fallback to empty obj.
const config = flow.get('dzeConfig') || {
    base_topic: 'zigbee2mqtt',
    automations: [],
    timers: []
};

// should we print debug stuff? 
const isDebug = flow.get('dzeDebug') || false;

// helper debug function.
function d() {
    if (!isDebug) {
        return;
    }
    
    Array.from(arguments).forEach((arg) => {
        node.warn(arg);
    });
}

// helper "is string" function.
function isStr(something) {
    return (typeof something === 'string' || something instanceof String);
}

// eval() helper - i know, eval is bad, but i have no choice unfortunately.
function e(str) {
    try {
        d('[DZE] evaling:', str);
        eval(str);
    } catch (e) {
        d('[DZE] could not eval expression!', str);
        return false;
    }
    
    return true;
}

d('[DZE] processing Zigbee message:', msg);

// here we go over the automations list and check if any matches.
config.automations.forEach((automation) => {

    // if the topic matches, we should process this message.
    if (msg.topic == config.base_topic + '/' + automation.when) {

        // we dont yet know if the conditions are met.
        pass = null;
        if (typeof automation.condition === "undefined") {
            // if there is no condition at all, we allow it.
            pass = true;
        } else {

            // this is an ugly hack: we need to create variables in the current
            // JS VM context and assign them the values from the Zigbee message
            // we caught, so we will be able to write conditions for them.
            // (such as "action", "contact", "state", "linkquality", etc.)
            for(let prop in msg.payload) {
                // here we create a JS expression to create new global variables.
                let evalProp = `${prop} = ${JSON.stringify(msg.payload[prop])};`;
                // and we evaluate these expressions.
                e(evalProp);
            }

            // now that we have some variables accessible globally, we can also
            // evaluate the condition expression, which could contain any arbitrary JS
            // code, such as boolean logic, math, string comparison, etc.
            let str = "pass = (" + automation.condition + ");";
            // we either evaluate it and set its value that way,
            // or if there was any error, we fallback to false.
            e(str) || (pass = false);
        }
        d("pass=", pass);

        // if the conditions were met, we go on and react to the message.
        if (pass) {
            to_send = null;
            if (isStr(automation.send)) {
                trigger = msg.payload;
                e(`to_send = ${automation.send}`);
            } else {
                to_send = automation.send;
            }

            if (to_send) {
                let message = {
                    topic: config.base_topic + '/' + automation.to + '/set',
                    payload: to_send
                }
                node.send(message);
            }
            
            /*
            if (automation.start) {
                timer_exists = false;
                for (let i = 0 ; i < config.timers.length ; i++) {
                    if (config.timers[i].name == automation.start) {
                        timer_exists = true;
                        break;
                    }
                }
                
                if (timer_exists) {
                    let scheduledTimers = flow.get("scheduledTimers") || [];
                    otherTimers = scheduledTimers.filter((timer) => (timer.name !== automation.start));
                    
                    
                    
    
                    
                    let thisTimer = {
                        name: automation.start,
                        length: length,
                        activate_at: Date.now() + length * 1000
                    }


                    timers.push(thisTimer)
                    
                    flow.set("timers", timers)


                } else {
                    d(`timer named "${automation.start}" does not exist`);
                }
                

                for (let i = 0 ; i < timers.length ; i++ ) {
                    if (timers[i].name == thisTimer.name) {
                        node.warn(`${name} already existed, replacing...`)
                        timers[i] = thisTimer;
                        inserted = true;
                        break;
                    }
                }
            }
            */
        }
    }
})

node.done();