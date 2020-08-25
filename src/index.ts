import { rangeFunctionHelper } from "./helpers";
import { eachHelper } from "./helpers";
import { ifHelper } from "./helpers";
import { commentHelper } from "./helpers";
import * as utils from "./utils";
import * as errors from "./errors";
import cloneDeep from "clone-deep";

export class JSONTemplateEngine {
  private _helpers: { [key: string]: any } = {};
  private _helpersFunctions: { [key: string]: any } = {};
  private _handlerProxyData = {
    get: (target: any, name: string) => {
      if (typeof target[name] === "function") {
        return target[name]();
      } else {
        return target[name];
      }
    }
  };
  private readonly keyHelper: string = "command";

  constructor(options?: { keyHelper: string }) {
    if (options) {
      if ("keyHelper" in options) {
        this.keyHelper = options.keyHelper;
      }
    }
    this.registerHelper("comment", commentHelper);
    this.registerHelper("if", ifHelper);
    this.registerHelper("each", eachHelper);

    this.registerFunctionHelper("#range", rangeFunctionHelper);
  }

  registerHelper(directive: string, handler: any): void {
    if (directive in this._helpers) {
      throw new errors.JSONTemplateEngineBaseError(`${directive} already exist.`);
    }
    this._helpers[directive] = handler;
  }
  registerFunctionHelper(directive: string, handler: any): void {
    if (!directive.startsWith("#")) {
      directive = `#${directive}`;
    }
    if (directive in this._helpersFunctions) {
      throw new errors.JSONTemplateEngineBaseError(`${directive} already exist.`);
    }
    this._helpersFunctions[directive] = handler;
  }

  async compile(template: any, data = {}) {
    const proxyData = new Proxy(cloneDeep(data), this._handlerProxyData);
    return this.parse(template, proxyData);
  }

  private async parse(value: any, data: any): Promise<any> {
    switch (typeof value) {
      case "string":
        return this.parseValue(value, data);
      case "object":
        if (this.isHelper(value)) {
          return this.parseHelper(value, data);
        }
        return this.parseObject(value, data);
      default:
        return value;
    }
  }

  private async parseValue(value: string, data: any) {
    const regFunction = /((#.+?)\((.*?)\)).*?/g;
    let result: string;
    const resultParse = await utils.replaceAsync(value, regFunction, async (...match: string[]) => {
      const args = String(await this.parseValue(match[3], data));
      const helperName = match[2];
      const resultHelper = await this._helpersFunctions[helperName](
        ...args.split(",").map(e => utils.convertStringToValue(e.trim()))
      );
      return utils.stringifyValue(resultHelper);
    });
    const reg = new RegExp("{{(.*?)}}", "g");
    result = resultParse.replace(reg, (...match) => {
      const resultEval = JSONTemplateEngine.evaluateExpression(match[1].trim(), data);
      return utils.stringifyValue(resultEval);
    });

    return utils.convertStringToValue(result);
  }

  private static evaluateExpression(expression: string, data: any) {
    try {
      const evaluate = new Function(
        "data",
        `with (data) {
          return ${expression};
        }`
      );
      return evaluate(data);
    } catch (e) {
      if (e instanceof SyntaxError || e instanceof ReferenceError) {
        throw new errors.JSONTemplateEngineSyntaxError(e.message + `: ${expression}`);
      } else if (e instanceof Error) {
        throw new errors.JSONTemplateEngineBaseError(e.message + `: ${expression}`);
      }
    }
  }

  private isHelper(template: any): boolean {
    return this.keyHelper in template && template[this.keyHelper] in this._helpers;
  }

  private async parseHelper(template: any, data: any): Promise<any> {
    const input = await this.parse(template.input, data);
    return this._helpers[template[this.keyHelper]](input, template.outputs, data, {
      parse: this.parse.bind(this)
    });
  }

  private async parseObject(template: any, data: any): Promise<any> {
    const type = utils.getTypeArrayOrObject(template);
    const result: any = type === "array" ? [] : {};

    for (const key of Object.keys(template)) {
      const resultCompile = await this.parse(template[key], data);
      if (type === "array") {
        result.push(resultCompile);
      } else {
        result[key] = resultCompile;
      }
    }
    // if (typeof result === "object" && !Object.keys(result).length) {
    //   return undefined;
    // }
    return result;
  }
}