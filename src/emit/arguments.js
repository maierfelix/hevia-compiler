/**
 * @param {Node} node
 */
export function emitArguments(node) {
  this.expectNodeProperty(node, "arguments");
  this.write("(");
  let args = node.arguments;
  let ii = 0;
  let length = args.length;
  for (; ii < length; ++ii) {
    this.emitArgument(arg, node);
    if (ii + 1 < length) this.write(",");
  };
  this.write(")");
}