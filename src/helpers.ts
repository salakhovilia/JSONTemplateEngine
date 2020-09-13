import { JSONTemplateEngineSyntaxError } from "./errors";

export async function commentHelper() {
  return undefined;
}

export interface IHelperInput {
  name: string;
  value: any;
}

export interface IHelperOutput {
  name: string;
  template: any;
}

export interface IUtils {
  parse(template: any, data: any): Promise<any>;
}

export async function ifHelper(
  inputs: IHelperInput[],
  outputs: IHelperOutput[],
  data: any,
  utils: IUtils
): Promise<any> {
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
}

export async function eachHelper(
  inputs: IHelperInput[],
  outputs: IHelperOutput,
  data: any,
  utils: IUtils
): Promise<any> {
  const sequence = inputs.find(input => input.name === "values");
  if (sequence === undefined || outputs === undefined) {
    return undefined;
  }
  if (!Array.isArray(sequence.value)) {
    throw new JSONTemplateEngineSyntaxError("Input should be an array");
  }
  let values = [];
  values = Object.assign([], sequence.value);
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
