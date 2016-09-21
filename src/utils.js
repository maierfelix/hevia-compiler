import { VERSION } from "./cfg";

/**
 * @param {Object} cls
 * @param {Object} prot
 * @export
 */
export function inherit(cls, prot) {
  let key = null;
  for (key in prot) {
    if (prot[key] instanceof Function) {
      cls.prototype[key] = prot[key];
    }
  };
}

/**
 * @param  {*} value
 * @return {String}
 */
export function getType(value) {
  if (typeof value === "string") return ("String");
  if (+value === value && !(value % 1)) return ("Int");
  if (+value === value) return ("Double");
  return ("Void");
}

export function greet() {
  if (
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().indexOf("chrome") > -1
  ) {
    var args = [
      `\n%c Hevia.js ${VERSION} %c %chttp://www.heviajs.com/ %c\n\n`,
      "color: #fff; background: #030307; padding:5px 0;",
      "color: #9598b9; background: #2d316b; padding:5px 0;",
      "color: #9598b9; background: #2d316b; padding:5px 0;",
      "color: #9598b9; background: #2d316b; padding:5px 0;"
    ];
    console.log.apply(console, args);
  } else {
    console.log("Hevia.js - " + VERSION + " - http://www.heviajs.com/\n");
  }
}