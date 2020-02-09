#Install

`npm install json-template-engine`
#Usage

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
      values: [0, 1, 2], // #range(3, 0)
      iteration: "foo-{{iteration.value}}-{{iteration.index}}"
    }
  }
};
const data = {
  foo2: {
    enable: false
  }
};
const JSONTemplateEngine = require("json-template-engine");
const JsonParser = new JSONTemplateEngine();
console.log(JsonParser.compile(template, data));
```
