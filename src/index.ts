import { IHandlerHelper, rangeFunctionHelper } from "./helpers";
import { eachHelper } from "./helpers";
import { ifHelper } from "./helpers";
import { commentHelper } from "./helpers";
import * as _utils from "./utils";
import * as _errors from "./errors";

export const errors = _errors;
export const utils = _utils;

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

  registerHelper(directive: string, handler: IHandlerHelper): void {
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

  async compile(template: any, data = {}, ...args: any[]) {
    const proxyData = new Proxy(data, this._handlerProxyData);
    return this.parse(template, proxyData, "", ...args);
  }

  private async parse(value: any, data: any, path: string = "", ...args: any[]): Promise<any> {
    switch (typeof value) {
      case "string":
        return await this.parseValue(value, data, path);
      case "object":
        if (this.isHelper(value)) {
          return await this.parseHelper(value, data, path, ...args);
        }
        return await this.parseObject(value, data, path);
      default:
        return value;
    }
  }

  private async parseValue(value: string, data: any, path: string) {
    const regFunction = /((#.+?)\((.*?)\)).*?/g;
    let result: string;
    const resultParse = await _utils.replaceAsync(
      value,
      regFunction,
      async (...match: string[]) => {
        const args = String(await this.parseValue(match[3], data, path));
        const helperName = match[2];
        if (!(helperName in this._helpersFunctions)) {
          throw new errors.JSONTemplateEngineBaseError(`${helperName} not found in ${path}`);
        }
        const resultHelper = await this._helpersFunctions[helperName](
          ...args.split(",").map(e => _utils.convertStringToValue(e.trim()))
        );
        return _utils.stringifyValue(resultHelper);
      }
    );
    const reg = new RegExp("{{(.*?)}}", "g");
    result = resultParse.replace(reg, (...match) => {
      const resultEval = JSONTemplateEngine.evaluateExpression(match[1].trim(), data, path);
      return _utils.stringifyValue(resultEval);
    });

    return _utils.convertStringToValue(result);
  }

  private static evaluateExpression(expression: string, data: any, path: string) {
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
        throw new errors.JSONTemplateEngineSyntaxError(e.message + `: ${expression} in ${path}`);
      } else if (e instanceof Error) {
        throw new errors.JSONTemplateEngineBaseError(e.message + `: ${expression} in ${path}`);
      }
    }
  }

  private isHelper(template: any): boolean {
    return this.keyHelper in template && template[this.keyHelper] in this._helpers;
  }

  private async parseHelper(template: any, data: any, path: string, ...args: any[]): Promise<any> {
    const newPath = path + "/" + template[this.keyHelper];
    if (!("inputs" in template)) {
      throw new errors.JSONTemplateEngineBaseError(`Inputs not found. Path ${newPath}`);
    }
    if (!("outputs" in template)) {
      throw new errors.JSONTemplateEngineBaseError(`Outputs not found. Path: ${newPath}`);
    }
    const inputs = await this.parse(template.inputs, data, newPath, ...args);
    return await this._helpers[template[this.keyHelper]](
      inputs,
      template.outputs,
      data,
      {
        parse: this.parse.bind(this),
        path: newPath
      },
      template,
      ...args
    );
  }

  private async parseObject(template: any, data: any, path: string): Promise<any> {
    const type = _utils.getTypeArrayOrObject(template);
    const result: any = type === "array" ? [] : {};

    for (const key of Object.keys(template)) {
      const newPath = path + "/" + key;
      const resultCompile = await this.parse(template[key], data, newPath);
      if (resultCompile !== undefined) {
        if (type === "array") {
          result.push(resultCompile);
        } else {
          result[key] = resultCompile;
        }
      }
    }
    return result;
  }
}
