import { TT, Type, Token } from "./token";

/**
 * @param {Node} node
 */
export function walkSimple(node) {
  this.expectNodeKind(node, Type.Program);
  this.pushScope(node);
  this.walkNode(node, null);
  this.popScope();
}

/**
 * @param {Array} array
 * @param {Node} parent
 */
export function walkArray(array, parent) {
  let ii = 0, length = array.length;
  for (; ii < length; ++ii) {
    this.writeIndent();
    this.walkNode(array[ii], parent);
    this.write(";");
    if (ii + 1 < length) this.write("\n");
  };
}

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function walkNode(node, parent) {
  let kind = this.getNodeTypeAsString(node);
  //this.triggerVisitor(node, kind);
  if (this[kind] !== void 0) this[kind](node, parent);
  else this.throw(`${kind} type isnt supported yet!`);
}

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function Program(node, parent) {
  this.expectNodeKind(node, Type.Program);
  this.walkArray(node.body.body, parent);
}

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function BlockStatement(node, parent) {
  this.expectNodeKind(node, Type.BlockStatement);
  this.write(" {\n")
  let kind = this.getNodeTypeAsString(parent);
  this.indent();
  this.walkArray(node.body, parent);
  this.writeIndent();
  this.outdent();
  this.write("\n}");
}

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function BinaryExpression(node, parent) {
  this.expectNodeKind(node, Type.BinaryExpression);
  this.walkNode(node.left, node);
  let operator = this.getOperatorByKind(node.operator);
  this.write(` ${operator.op} `);
  this.walkNode(node.right, node);
}

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function Literal(node, parent) {
  this.expectNodeKind(node, Type.Literal);
  if (this.isIdentifier(node)) {
    let resolve = this.resolveIdentifier(node.value);
    if (resolve.isReference && !parent.isArgument) this.write(`${node.value}.$iov`);
    else this.write(node.value);
  } else {
    this.write(node.value);
  }
}

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function VariableDeclaration(node, parent) {
  let name = null;
  let decl = null;
  let declarations = node.declarations;
  let ii = 0;
  let length = declarations.length;
  let symbol = TT[node.symbol].toLowerCase();
  this.write(`${symbol} `);
  for (; ii < length; ++ii) {
    decl = declarations[ii];
    name = this.isNodeKindOf(decl, Type.TypeExpression) ? decl.name.value : decl.value;
    decl.init = node.init[ii];
    this.scope.register(name, decl);
    this.write(name);
    if (decl.init) this.write(" = ");
    if (decl.isLaterPointer) {
      this.write("{ ");
      this.write("$iov: ");
      this.walkNode(decl.init, decl);
      this.write(" }");
    }
    else {
      this.walkNode(decl.init, decl);
    }
    if (ii + 1 < length) this.write(", ");
  };
}

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function TypeExpression(node, parent) {
  this.expectNodeKind(node, Type.TypeExpression);
  this.walkNode(node.name, node);
  this.walkNode(node.type, node);
}

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function ReturnStatement(node, parent) {
  this.expectNodeKind(node, Type.ReturnStatement);
  this.write("return (");
  this.walkNode(node.argument, node);
  this.write(")");
}

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function FunctionDeclaration(node, parent) {
  this.expectNodeKind(node, Type.FunctionDeclaration);
  node.resolvedType = node.type;
  this.write("var ");
  this.write(node.name);
  this.write(" = ");
  this.write("function");
  this.scope.register(node.name, node);
  this.pushScope(node);
  this.emitArguments(node);
  if (node.body !== null) this.walkNode(node.body, node);
  this.popScope();
}

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function CallExpression(node, parent) {
  let name = node.callee.value;
  let resolve = this.resolveIdentifier(name);
  this.write(name);
  this.emitParameters(node);
}

/**
 * @param {Node} node
 */
export function emitParameters(node) {
  let args = node.arguments;
  let ii = 0;
  let length = args.length;
  this.write("(");
  for (; ii < length; ++ii) {
    let arg = args[ii];
    // Trace declarator as later pointer
    this.traceAsPointer(arg);
    this.walkNode(arg.type, arg);
    if (ii + 1 < length) this.write(", ");
  };
  this.write(")");
}

/**
 * @param {Node} node
 */
export function emitArguments(node) {
  let args = node.arguments;
  let ii = 0;
  let length = args.length;
  this.write("(");
  for (; ii < length; ++ii) {
    let arg = args[ii];
    let name = this.isNodeKindOf(arg, Type.TypeExpression) ? arg.name.value : arg.value;
    this.scope.register(name, arg);
    arg.isArgument = true;
    this.walkNode(arg.name, arg);
    if (ii + 1 < length) this.write(", ");
  };
  this.write(")");
}

/**
 * @param {Node} node
 */
export function traceAsPointer(node) {
  let isPointer = node.type && node.type.isPointer;
  if (isPointer) {
    let resolve = this.resolveIdentifier(node.type.value);
    resolve.isLaterPointer = true;
  }
}