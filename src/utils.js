import * as CFG from "./cfg";

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
 * @return {Number}
 */
export function getUid() {
  return (
    CFG.RENAME_INDEX++
  );
}

/**
 * @param  {*} value
 * @return {String}
 */
export function getType(value) {
  if (!isNaN(value)) {
    if (!(String(value).indexOf(".") === -1)) return ("Double");
    let nn = Number(value);
    if (nn % 1 === 0) return ("Int");
  }
  if (typeof value === "string") return ("String");
  return ("Void");
}

export function greet() {
  let version = CFG.VERSION;
  if (
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().indexOf("chrome") > -1
  ) {
    var args = [
      `\n%c Hevia.js ${version} %c %chttp://www.heviajs.com/ %c\n\n`,
      "color: #fff; background: #030307; padding:5px 0;",
      "color: #9598b9; background: #2d316b; padding:5px 0;",
      "color: #9598b9; background: #2d316b; padding:5px 0;",
      "color: #9598b9; background: #2d316b; padding:5px 0;"
    ];
    console.log.apply(console, args);
  } else {
    console.log("Hevia.js - " + version + " - http://www.heviajs.com/\n");
  }
}