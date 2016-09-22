import { TT, Type, Token, Operator } from "../token";

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function FunctionDeclaration(node, parent) {
  this.write("var ");
  this.write(node.name);
  this.write(" = ");
  this.write("function ");
  this.write("(");
  let ii = 0;
  let length = node.arguments.length;
  for (; ii < length; ++ii) {
    this.write(node.arguments[ii].name.value);
    if (ii + 1 < length) this.write(", ");
  };
  this.write(")");
}