module.exports.commentHelper = async () => {
  return undefined;
};

module.exports.ifHelper = async (template, data, utils) => {
  if (template === undefined || template.condition === undefined) {
    return undefined;
  }
  const condition = await utils.parse(template.condition, data);
  if (condition) {
    if (template.then) {
      return await utils.parse(template.then, data, utils.parseOptions);
    }
  } else {
    if (template.else) {
      return await utils.parse(template.else, data, utils.parseOptions);
    }
  }
  return undefined;
};

module.exports.eachHelper = async (template, data, utils) => {
  if (template.values === undefined || template.iteration === undefined) {
    return undefined;
  }
  let values = [];
  values = Object.assign([], await utils.parse(template.values, data));
  if (values) {
    const result = [];
    for (let index = 0; index < values.length; index++) {
      const iteration = { iteration: { value: values[index], index } };
      const tempData = Object.assign(iteration, data);
      result.push(await utils.parse(template.iteration, tempData, utils.parseOptions));
    }
    return result.length ? result : undefined;
  }
};

module.exports.rangeFunctionHelper = async (size = 0, startAt = 0) => {
  return Array.from(Array(size).keys()).map(i => i + startAt);
};
