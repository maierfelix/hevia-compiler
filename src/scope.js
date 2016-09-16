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
    if (this.table[name] !== null) {
      return (this.table[name] || null);
    } else {
      if (this.parent !== null) {
        return (this.parent.resolve(name));
      }
    }
    return (null);
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