class JSONTemplateEngineBaseError extends Error {
  constructor(message, name = "JSONTemplateEngineBaseError") {
    super();
    this.name = name;
    this.message = message;
  }
}
class JSONTemplateEngineSyntaxError extends JSONTemplateEngineBaseError {
  constructor(message) {
    super(message, "JSONTemplateEngineSyntaxError");
  }
}

module.exports.JSONTemplateEngineBaseError = JSONTemplateEngineBaseError;
module.exports.JSONTemplateEngineSyntaxError = JSONTemplateEngineSyntaxError;
