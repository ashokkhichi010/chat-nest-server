export const pick = (object: Object, keys: string[]) => keys.reduce((obj, key) => {
  if (object && Object.prototype.hasOwnProperty.call(object, key)) {
    obj[key] = object[key];
  }
  return obj;
}, {});