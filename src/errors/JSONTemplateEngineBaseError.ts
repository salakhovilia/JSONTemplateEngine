export class JSONTemplateEngineBaseError extends Error {
  constructor(message: string, name = "JSONTemplateEngineBaseError") {
    super();
    this.name = name;
    this.message = message;
  }
}
