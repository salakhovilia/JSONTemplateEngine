# Install

`npm install json-template-engine`

# Usage

```javascript
const template = {
  foo: "bar",
  "#comment": "put comment",
  foo2: {
    "#if": {
      condition: "{{foo2.enable}}",
      then: { data: "foo2-then" },
      else: { data: "foo2-else" }
    }
  },
  foos: {
    "#each": {
      values: "#range(3, 0)", // or [0, 1, 2]
      iteration: "foo-{{iteration.value}}-{{iteration.index}}"
    }
  },
  excludeField: {
    notParsed: "{{qwe}}"
  }
};
const data = {
  foo2: {
    enable: false
  }
};

const JSONTemplateEngine = require("json-template-engine");
const JsonParser = new JSONTemplateEngine();

const options = {
  helpers: true, // parse helpers? default true
  values: true, // parse values? default true
  exclude: ["excludeField"] // which fields in the object should be excluded (fields will not be parsed), default []
};

JsonParser.compile(template, data, options).then(result => {
  console.log(result);
});

/* print
    {
      foo: 'bar',
      foo2: { data: 'foo2-else' },
      foos: [ 'foo-0-0', 'foo-1-1', 'foo-2-2' ]
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
const ifHelper = async (template, data, utils) => {
  if (template === undefined || template.condition === undefined) {
    return undefined;
  }
  const condition = await utils.parse(template.condition, data);
  if (condition) {
    if ("then" in template) {
      return await utils.parse(template.then, data, utils.parseOptions);
    }
  } else {
    if ("else" in template) {
      return await utils.parse(template.else, data, utils.parseOptions);
    }
  }
  return undefined;
};

const rangeFunctionHelper = async (size = 0, startAt = 0) => {
  return Array.from(Array(size).keys()).map(i => i + startAt);
};

const JSONTemplateEngine = require("json-template-engine");
const JsonParser = new JSONTemplateEngine();
JsonParser.registerHelper("#if", ifHelper); // The name of the helper must begin with the symbol "#".
JsonParser.registerFunctionHelper("#range", rangeFunctionHelper); // The name of the helper must begin with the symbol "#".
```

## Parse Options
