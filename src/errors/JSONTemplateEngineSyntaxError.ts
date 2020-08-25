import { JSONTemplateEngineBaseError } from "./JSONTemplateEngineBaseError";

export class JSONTemplateEngineSyntaxError extends JSONTemplateEngineBaseError {
  constructor(message: string) {
    super(message, "JSONTemplateEngineSyntaxError");
  }
}
