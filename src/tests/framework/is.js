import { load } from 'js-yaml';
import { readFileSync } from 'fs';

// TODO:
//  * define custom types for reusability
//      e.g. if the same structure appears at multiple places, keep code DRY

const is = {
    __validationUnit: function() {
        this.__type = "";
        this.__required = true;
        this.__functionalValidators = [];
        this.__validateType = (value) => {
            throw '__validationUnit.validate() must not be used!';
        }

        this.validate = (value) => {
            if (typeof value === "undefined") {
                return !this.__required;
            } else {
                return this.__validateType(value) && 
                       this.__functionalValidators.filter(functionalValidator => !functionalValidator(value)).length == 0;
                       // ^ there is no functional validator lambda which does not validate the value
            }
        };

        this.optional = function() {
            this.__required = false;
            return this;
        };

        this.Where = function(functionalValidator) {
            this.__functionalValidators.push(functionalValidator);
            return this;
        }

        this.String = function() {
            this.__type = "string";
            this.__validateType = (value) => (
                typeof value === "string"
            );
            return this;
        };

        this.Boolean = function() {
            this.__type = "boolean";
            this.__validateType = (value) => (
                typeof value === "boolean"
            );
            return this;
        }

        this.Number = function() {
            this.__type = "number";
            this.__validateType = (value) => (
                typeof value === "number"
            );
            return this;
        };

        this.Object = function(schemaObj) {
            this.__type = "object";
            this.__schemaObj = schemaObj || {};
            this.__validateType = (value) => {
                if (typeof value !== "object") {
                    return false;
                }
                for (const schema in this.__schemaObj) {
                    if (!schemaObj[schema].validate(value[schema])) {
                        return false;
                    }
                }
                return true;
            };
            return this;
        };

        this.ArrayOf = function(schema) {
            this.__type = "array";
            this.__schema = schema;
            this.__validateType = (value) => (
                Array.isArray(value) &&
                value.filter(e => !this.__schema.validate(e)).length == 0
                // ^ there is no item in the array which is not validated by the schema
            );
            return this;
        };

        this.OneOf = function(schemaArray) {
            this.__type = "various";
            this.__schemaArray = schemaArray;
            this.__validateType = (value) => (
                this.__schemaArray.filter(schema => schema.validate(value)).length > 0
                // ^ there is at least one schema which validates the value
            );
            return this;
        }

        return this;
    }
};

is.optional = () => (new is.__validationUnit().optional());
is.required = () => (new is.__validationUnit());

is.String = () => (new is.__validationUnit().String());
is.Boolean = () => (new is.__validationUnit().Boolean());
is.Number = () => (new is.__validationUnit().Number());

is.Object = (schema) => (new is.__validationUnit().Object(schema));

is.ArrayOf = (schema) => (new is.__validationUnit().ArrayOf(schema));
is.OneOf = (schema) => (new is.__validationUnit().OneOf(schema));

console.log([
    is.String().validate() === false,
    is.String().validate(3) === false,

    is.String().validate("hello") === true,
    is.Number().validate(3) === true,
    is.Object().validate({}) === true,

    is.ArrayOf(is.Number()).validate([1, 2, 3]) === true,
    is.ArrayOf(is.String()).validate("not an array") === false,

    is.OneOf([is.Number(), is.String()]).validate(69) === true,
    is.OneOf([is.Number(), is.String()]).validate("hehe") === true,
    is.OneOf([is.Number(), is.String()]).validate({}) === false,
    is.OneOf([is.Number(), is.String(), is.Object()]).validate({}) === true,
    is.OneOf([is.Number(), is.Object()]).validate({}) === true,
    is.OneOf([is.Number(), is.Object()]).validate("sad") === false,

    is.ArrayOf(is.OneOf([is.String(), is.Number()])).validate([1, 2, "string", 4]) === true,
    is.ArrayOf(is.OneOf([is.String(), is.Number()])).validate([1, {}, "string", 4]) === false,

    is.ArrayOf(is.String()).validate(["array", "of", undefined, "oops"]) === false,
    is.ArrayOf(is.optional().String()).validate(["array", "of", undefined, "oops"]) === true,
    is.ArrayOf(is.String()).validate(["array", "of", null, "oops"]) === false,

    is.Object().validate() === false,
    is.Object().validate({}) === true,
    is.optional().Object().validate() === true,
    is.optional().Object().validate({}) === true,
    is.Object().validate({a:1}) === true,

    is.Object({
        str: is.String(),
        num: is.optional().Number(),
        oneof: is.OneOf([
            is.String(),
            is.ArrayOf()
        ]),
        arrayOfString: is.ArrayOf(is.String()),
        arrayOfAnyObj: is.ArrayOf(is.Object()),
        arrayOfDefinedObj: is.ArrayOf(is.Object({
            name: is.String(),
            age: is.Number(),
            hobbies: is.optional().ArrayOf(is.String())
        }))
    }).validate({
        str: "string",
        num: 42,
        oneof: [],
        arrayOfString: ["array", "of", "string"],
        arrayOfAnyObj: [{}, {a:1}, {something:"random"}],
        arrayOfDefinedObj: [{
            name: "me",
            age: 100
        }, {
            name: "myself",
            age: 120,
            hobbies: ["js", "bad"]
        }, {
            name: "and i",
            age: 80,
            hobbies: []
        }]
    }) === true,

    is.Object({
        str: is.optional().String(),
        reqStr: is.String(),

        num: is.Number(),
        bln: is.Boolean(),

        arrayOfStr: is.ArrayOf(is.String()),
        arrayOfStuff: is.ArrayOf(is.OneOf([is.String(), is.Number()])),
        subObj: is.Object(),
        subObjStrict: is.Object({
            substr: is.String(),
            subBln: is.Boolean()
        })
    }).validate({
        reqStr: "this is required",
        num: 5,
        bln: false,
        arrayOfStr: ["an", "array"],
        arrayOfStuff: ["string", 42],
        subObj: {},
        subObjStrict: {
            substr: "this must exist",
            subBln: true
        }
    }) === true
]);

console.log(is.Object({
    base_topic: is.String(),
    automations: is.ArrayOf(is.Object({
        when: is.String(),
        condition: is.optional().String(),
        send: is.optional().OneOf([
            is.String(),
            is.Object()
        ]),
        to: is.optional().String(),
        start: is.optional().OneOf([
            is.String(),
            is.ArrayOf(is.String())
        ]),
        cancel: is.optional().OneOf([
            is.String(),
            is.ArrayOf(is.String())
        ])
    })),
    timers: is.optional().ArrayOf(is.Object({
        name: is.String(),
        duration: is.optional().OneOf([
            is.String(),
            is.Number()
        ]),
        send: is.optional().OneOf([
            is.String(),
            is.Object()
        ]),
        to: is.optional().String(),
        start: is.optional().OneOf([
            is.String(),
            is.ArrayOf(is.String())
        ]),
        cancel: is.optional().OneOf([
            is.String(),
            is.ArrayOf(is.String())
        ])
    }))
}).validate(load(readFileSync('./sample.events.yaml'))));
