/**
 * @param {Node} node
 */
export function emitVariableStarter(node) {
  this.write("var ");
  this.write(node.name);
}

/**
 * @param {Node} node
 */
export function emitVariableDeclaration(node) {
  console.log(node);
  this.emitVariableStarter(node);
}