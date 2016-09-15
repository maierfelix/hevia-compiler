import { TT, Type, Token } from "./token";

/**
 * @param {Node} node
 */
export function walk(node) {
  this.walkProgram(node);
}

/**
 * @param {Node} node
 */
export function walkProgram(node) {
  this.expectNodeKind(node, Type.Program);
  this.walkBlock(node.body);
}

/**
 * @param {Node} node
 */
export function walkBlock(node) {
  this.expectNodeKind(node, Type.BlockStatement);
  let ii = 0, length = node.body.length;
  for (; ii < length; ++ii) this.walkNode(node.body[ii]);
}

/**
 * @param {Array} array
 */
export function walkArray(array) {
  for (let node of array) {
    this.walkNode(node);
  };
}

/**
 * @param {Node} node
 */
export function walkNode(node) {
  switch (node.kind) {
    case Type.FunctionDeclaration:
      this.walkFunctionDeclaration(node);
    break;
    case Type.ReturnStatement:
      this.walkReturnStatement(node);
    break;
    case Type.BinaryExpression:
      this.walkBinaryExpression(node);
    break;
    case Type.TypeExpression:
      this.walkTypeExpression(node);
    break;
    case Type.Literal:
      this.walkLiteral(node);
    break;
  };
}

/**
 * @param {Node} node
 */
export function walkBinaryExpression(node) {
  this.walkNode(node.left);
  this.walkNode(node.right);
}

/**
 * @param {Node} node
 */
export function walkTypeExpression(node) {
  this.walkNode(node.name);
  this.walkNode(node.type);
}

/**
 * @param {Node} node
 */
export function walkLiteral(node) {
  //console.log(node);
}

/**
 * @param {Node} node
 */
export function walkReturnStatement(node) {
  this.walkNode(node.argument);
}

/**
 * @param {Node} node
 */
export function walkFunctionDeclaration(node) {
  this.expectNodeKind(node, Type.FunctionDeclaration);
  if (node.arguments.length) this.walkArray(node.arguments);
  this.walkNode(node.type);
  if (node.body !== null) this.walkBlock(node.body);
}

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function walkArgument(node, parent) {
  let isType = this.isNodeKindOf(node, Type.TypeExpression);
  let name = isType ? node.name.value : node.value;
  console.log(name, isType);
}