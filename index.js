const { rangeFunctionHelper } = require("./src/helpers");
const { eachHelper } = require("./src/helpers");
const { ifHelper } = require("./src/helpers");
const { commentHelper } = require("./src/helpers");
const utils = require("./src/utils");
const errors = require("./src/errors");

module.exports = class JSONTemplateEngine {
  constructor() {
    this._helpers = {};
    this._helpersFunctions = {};
    this._handlerProxyData = {
      get: (target, name) => {
        if (typeof target[name] === "function") {
          return target[name]();
        } else {
          return target[name];
        }
      }
    };

    this.registerHelper("#comment", commentHelper);
    this.registerHelper("#if", ifHelper);
    this.registerHelper("#each", eachHelper);

    this.registerFunctionHelper("#range", rangeFunctionHelper);
  }
  registerHelper(directive, handler) {
    if (directive in this._helpers) {
      throw new errors.JSONTemplateEngineBaseError(`${directive} already exist.`);
    }
    this._helpers[directive] = handler;
  }
  registerFunctionHelper(directive, handler) {
    if (directive in this._helpersFunctions) {
      throw new errors.JSONTemplateEngineBaseError(`${directive} already exist.`);
    }
    this._helpersFunctions[directive] = handler;
  }
  async parseTemplate(template, data, parseOptions = { helpers: true, values: true, exclude: [] }) {
    const type = utils.getTypeArrayOrObject(template);
    let result = type === "array" ? [] : {};

    for (const key of Object.keys(template)) {
      if (parseOptions.exclude.includes(key)) {
        continue;
      }
      if (key in this._helpers) {
        let reservedKeysResult;
        if (parseOptions.helpers) {
          reservedKeysResult = await this._helpers[key](template[key], data, {
            parseTemplate: this.parseTemplate.bind(this),
            parseValue: this.parseValue.bind(this),
            parseOptions
          });
        }
        if (reservedKeysResult !== undefined) {
          result = reservedKeysResult;
        } else {
          delete result[key];
        }
        continue;
      }

      if (typeof template[key] === "number" || typeof template[key] === "boolean") {
        result[key] = template[key];
        continue;
      }
      if (typeof template[key] === "string") {
        const resultParseValue = await this.parseValue(template[key], data, parseOptions);
        if (resultParseValue !== undefined) {
          result[key] = resultParseValue;
        }
        continue;
      }
      if (typeof template[key] === "object") {
        const resultCompile = await this.parseTemplate(template[key], data, parseOptions);
        if (resultCompile) {
          if (type === "object") {
            result[key] = resultCompile;
          } else {
            result.push(resultCompile);
          }
        }
        continue;
      }
    }
    if (Object.keys(result).length) {
      return result;
    } else {
      return undefined;
    }
  }
  async parseValue(value, data, parseOptions = { helpers: true, values: true, exclude: [] }) {
    let resultParseValue = value;
    if (parseOptions.values) {
      const reg = new RegExp("{{(.*?)}}", "g");
      resultParseValue = value.replace(reg, (...match) => {
        const resultEval = this.evaluateExpression(match[1].trim(), data);
        return utils.stringifyValue(resultEval);
      });
    }
    const regFunction = /((#.+?)\((.*?)\)).*?/g;
    const resultParseFunction = await utils.replaceAsync(
      resultParseValue,
      regFunction,
      async (...match) => {
        return utils.stringifyValue(
          await this._helpersFunctions[match[2]](
            ...match[3].split(",").map(value => utils.convertStringToValue(value))
          )
        );
      }
    );
    return utils.convertStringToValue(resultParseFunction);
  }
  evaluateExpression(expression, data) {
    try {
      const evaluate = new Function(
        "data",
        `
      with (data) {
        return ${expression};
      }`
      );
      return evaluate(data);
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new errors.JSONTemplateEngineSyntaxError(e.message + `: ${expression}`);
      } else if (e instanceof Error) {
        throw new errors.JSONTemplateEngineBaseError(e.message + `: ${expression}`);
      }
    }
  }
  async compile(template, data = {}, parseOptions = { helpers: true, values: true, exclude: [] }) {
    const proxyData = new Proxy(Object.assign({}, data), this._handlerProxyData);
    const options = {
      helpers: parseOptions.helpers || true,
      values: parseOptions.values || true,
      exclude: parseOptions.exclude || []
    };
    return this.parseTemplate(template, proxyData, options);
  }
};
