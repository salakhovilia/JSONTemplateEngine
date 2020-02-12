module.exports.commentHelper = async () => {
  return undefined;
};

module.exports.ifHelper = async (template, data, utils) => {
  if (template === undefined || template.condition === undefined) {
    return undefined;
  }
  const condition = await utils.parseValue(template.condition, data);
  if (condition) {
    if (template.then) {
      return await utils.parseTemplate(template.then, data, utils.parseOptions);
    }
  } else {
    if (template.else) {
      return await utils.parseTemplate(template.else, data, utils.parseOptions);
    }
  }
  return undefined;
};

module.exports.eachHelper = async (template, data, utils) => {
  if (template.values === undefined || template.iteration === undefined) {
    return undefined;
  }
  let values = [];
  if (typeof template.values === "string") {
    values = await utils.parseValue(template.values, data);
  } else if (template.values instanceof Array) {
    values = Object.assign([], template.values);
  }
  if (values) {
    const result = [];
    for (let index = 0; index < values.length; index++) {
      const iteration = { iteration: { value: values[index], index } };
      const tempData = Object.assign(iteration, data);
      if (typeof template.iteration === "object") {
        result.push(await utils.parseTemplate(template.iteration, tempData, utils.parseOptions));
      } else if (typeof template.iteration === "string") {
        result.push(await utils.parseValue(template.iteration, tempData, utils.parseOptions));
      } else {
        result.push(template.iteration);
      }
    }
    return result.length ? result : undefined;
  }
};

module.exports.rangeFunctionHelper = async (size = 0, startAt = 0) => {
  return Array.from(Array(size).keys()).map(i => i + startAt);
};
