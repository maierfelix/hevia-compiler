import { TT, Type, Token, Operator } from "../token";

import * as CFG from "../cfg";

/**
 * @class Scope
 * @export
 */
export default class Scope {

  /**
   * @param {Node} scope
   * @param {Node} parent
   * @constructor
   */
  constructor(scope, parent) {

    /**
     * Scope
     * @type {Node}
     */
    this.scope = scope;

    /**
     * Parent
     * @type {Node}
     */
    this.parent = parent;

    /**
     * Symbol table
     * @type {Object}
     */
    this.table = {};

  }

  /**
   * @param {String} name
   * @return {Node}
   */
  resolve(name) {
    let local = this.table[name];
    if (local !== void 0) {
      // enum
      if (local.isEnum) return (local.key);
      return (local);
    }
    else {
      if (this.parent !== null) {
        return (this.parent.resolve(name));
      }
    }
    return (null);
  }

  /**
   * @param {String} name
   * @return {Boolean}
   */
  isNativeSymbol(name) {
    switch (name) {
      case "print":
        return (true);
      break;
      default:
        return (false);
      break;
    }
  }

  /**
   * @param {Node} node
   * @return {String}
   */
  getName(node) {
    return (
      node.value || node.raw || node.name || node.id
    );
  }

  /**
   * @param {String} name
   * @param {Node} node
   */
  register(name, node) {
    this.table[name] = node;
  }

}