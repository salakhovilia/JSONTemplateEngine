# Install

`npm install json-template-engine`

# Usage

```javascript
const template = {
  simpleText: "bar",
  condition: {
    command: "if",
    inputs: [
      {
        name:"condition",
        value: "{{condition.enable}}"
      }
    ],
    outputs: [
      {
        name: "then",
        template: { data: "condition then" }
      },
      {
        name: "else",
        template: { data: "condition else" }
      }
    ]
  },
  each: {
    command: "each",
    inputs: [
      {
          name: "values",
          value: "#range(3, 0)"
      }
    ],
    outputs: {
      name: "iteration",
      template: "value: {{iteration.value}}; index: {{iteration.index}}"
    }
  }
};
const data = {
  condition: {
    enable: false
  }
};

const JSONTemplateEngine = require("json-template-engine");
const JsonParser = new JSONTemplateEngine({
 keyHelper: "command" // change key for helper, default 'command'
});

JsonParser.compile(template, data).then(result => {
  console.log(result);
});

/* print result
    {
      simpleText: 'bar',
      condition: { data: 'condition else' },
      each: [ 'value: 0; index: 0', 'value: 1; index: 1', 'value: 2; index: 2' ]
    }
*/
```

# Helpers

In the library there is the possibility of implementing 2 types of helpers.

1. Helpers for changing the structure of templates. Out of the box there is an "if" and "each" helper.
2. Function helpers (asynchronous functions are also supported). The default range helper is available, which generates an array of elements.

You can register by calling the methods
`JsonParser.registerHelper (<directive>, <handler>)` and `JsonParser.registerFunctionHelper (<directive>, <handler>)`, respectively.

## Example

For example, I will give registration of helpers "range" and "if".

```javascript
const ifHelper = async (inputs, outputs, data, utils) => {
    const condition = inputs.find(input => input.name === "condition");
    if (condition === undefined || outputs === undefined) {
       return undefined;
    }
    const outputName = condition.value ? "then" : "else";
    const output = outputs.find(e => e.name === outputName);
    if (output) {
      return await utils.parse(output.template, data);
    }
    return undefined;
};

const rangeFunctionHelper = async (size = 0, startAt = 0) => {
  return Array.from(Array(size).keys()).map(i => i + startAt);
};

const JSONTemplateEngine = require("json-template-engine");
const JsonParser = new JSONTemplateEngine();
JsonParser.registerHelper("if", ifHelper); // The name of the helper must begin with the symbol "#".
JsonParser.registerFunctionHelper("range", rangeFunctionHelper); // The name of the helper must begin with the symbol "#".
```
