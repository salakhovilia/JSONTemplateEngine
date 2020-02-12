module.exports.replaceAsync = async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
};
module.exports.getTypeArrayOrObject = function getTypeArrayOrObject(obj) {
  if (obj instanceof Array) {
    return "array";
  } else if (obj instanceof Object) {
    return "object";
  }
};
module.exports.stringifyValue = function stringifyValue(value) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return value;
};
function tryParseJSON(jsonString) {
  try {
    const o = JSON.parse(jsonString);
    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {}

  return jsonString;
}
module.exports.tryParseJSON = tryParseJSON;
module.exports.convertStringToValue = function convertStringToValue(value) {
  if (value.length === 0) {
    return undefined;
  }
  if (!isNaN(Number(value))) {
    return Number(value);
  }
  if (value.trim().toLowerCase() === "true") {
    return true;
  }
  if (value.trim().toLowerCase() === "false") {
    return false;
  }
  return tryParseJSON(value);
};
