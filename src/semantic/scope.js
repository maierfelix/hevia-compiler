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

    this.native = {
      print: {
        kind: Type.FunctionDeclaration,
        arguments: []
      }
    };

    this.index = 0;

  }

  /**
   * @return {Number}
   */
  getUid() {
     return (
      CFG.RENAME_INDEX++
    );
  }

  /**
   * @param {String} name
   * @return {Node}
   */
  resolve(name) {
    let local = this.table[name];
    if (local !== void 0) return (local);
    else {
      if (this.isNativeSymbol(name)) {
        return (this.native[name]);
      }
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
   * @param {Number} type
   * @return {Node}
   */
  getByType(type) {
    if (this.scope && this.scope.kind === type) {
      return (this.scope);
    } else {
      if (this.parent !== null) {
        return (this.parent.getByType(type));
      }
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