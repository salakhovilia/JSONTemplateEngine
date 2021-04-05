import { JSONTemplateEngineSyntaxError } from "./errors";

export type IHandlerHelper = (
  inputs: IHelperInput[],
  outputs: IHelperOutput[],
  data: any,
  utils: IUtils,
  ...args: any[]
) => any;

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
  parse(template: any, data: any, path: string, ...args: any[]): Promise<any>;
  path: string;
}

export async function ifHelper(
  inputs: IHelperInput[],
  outputs: IHelperOutput[],
  data: any,
  utils: IUtils,
  ...args: any[]
): Promise<any> {
  const condition = inputs.find(input => input.name === "condition");
  if (condition === undefined || outputs === undefined) {
    return undefined;
  }
  const outputName = condition.value ? "then" : "else";
  const output = outputs.find(e => e.name === outputName);
  if (output) {
    return await utils.parse(output.template, data, utils.path + "/" + output.name, ...args);
  }
  return undefined;
}

export async function eachHelper(
  inputs: IHelperInput[],
  outputs: IHelperOutput[],
  data: any,
  utils: IUtils,
  ...args: any[]
): Promise<any> {
  const sequence = inputs.find(input => input.name === "values");
  if (sequence === undefined || outputs === undefined) {
    return undefined;
  }
  if (!Array.isArray(sequence.value)) {
    throw new JSONTemplateEngineSyntaxError(
      "Input should be an array, received: " + sequence.value + ". Path: " + utils.path
    );
  }
  const output = outputs.find(outputPredicate => outputPredicate.name === "iteration");
  if (!output) {
    return;
  }

  let values: any[];
  values = Object.assign([], sequence.value);
  if (values) {
    const result = [];
    for (let index = 0; index < values.length; index++) {
      const iteration = { iteration: { value: values[index], index } };
      const tempData = Object.assign(iteration, data);
      const resultTemplate = await utils.parse(
        output.template,
        tempData,
        utils.path + "/" + output.name,
        ...args
      );
      if (resultTemplate !== undefined) {
        result.push(resultTemplate);
      }
    }
    return result.length ? result : undefined;
  }
}

export async function rangeFunctionHelper(size = 0, startAt = 0): Promise<number[]> {
  return Array.from(Array(size).keys()).map(i => i + startAt);
}
