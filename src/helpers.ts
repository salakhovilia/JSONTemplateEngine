import { JSONTemplateEngineSyntaxError } from "./errors";

export async function commentHelper() {
  return undefined;
}

export interface IHelperOutput {
  name: string;
  template: any;
}

export interface IUtils {
  parse(template: any, data: any): Promise<any>;
}

export async function ifHelper(
  condition: any,
  outputs: IHelperOutput[],
  data: any,
  utils: IUtils
): Promise<any> {
  if (condition === undefined || outputs === undefined) {
    return undefined;
  }
  const outputName = condition ? "then" : "else";
  const output = outputs.find(e => e.name === outputName);
  if (output) {
    return await utils.parse(output.template, data);
  }
  return undefined;
}

export async function eachHelper(
  input: any,
  outputs: IHelperOutput,
  data: any,
  utils: IUtils
): Promise<any> {
  if (input === undefined || outputs === undefined) {
    return undefined;
  }
  if (!Array.isArray(input)) {
    throw new JSONTemplateEngineSyntaxError("Input should be an array");
  }
  let values = [];
  values = Object.assign([], input);
  if (values) {
    const result = [];
    for (let index = 0; index < values.length; index++) {
      const iteration = { iteration: { value: values[index], index } };
      const tempData = Object.assign(iteration, data);
      result.push(await utils.parse(outputs, tempData));
    }
    return result.length ? result : undefined;
  }
}

export async function rangeFunctionHelper(size = 0, startAt = 0): Promise<number[]> {
  return Array.from(Array(size).keys()).map(i => i + startAt);
}
