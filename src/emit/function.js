/**
 * @param {Node} node
 */
export function emitFunctionDeclaration(node) {
  this.emitVariableDeclaration(node);
  this.write("function");
  this.emitArguments(node);
}