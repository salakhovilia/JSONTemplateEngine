export async function replaceAsync(str: string, regex: RegExp, asyncFn: any): Promise<string> {
  const promises: Promise<any>[] = [];
  str.replace(regex, (match: string, ...args: string[]) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
    return match;
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}

export function getTypeArrayOrObject(obj: any[] | object): "array" | "object" {
  if (obj instanceof Array) {
    return "array";
  } else {
    return "object";
  }
}

export function stringifyValue(value: any): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return value;
}

export function tryParseJSON(jsonString: string): object | string {
  try {
    const o = JSON.parse(jsonString);
    if (o && typeof o === "object") {
      return o;
    }
    // tslint:disable-next-line:no-empty
  } catch (e) {}

  return jsonString;
}

export function convertStringToValue(value: string): any {
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
}
