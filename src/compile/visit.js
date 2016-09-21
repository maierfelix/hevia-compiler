import { TT, Type, Token, Operator } from "../token";

/**
 * @param {Node} node
 */
export function CallExpression(node) {
  let callee = node.callee.value;
  let resolve = this.resolveIdentifier(callee);
  if (!resolve) this.throw(`Can't resolve call to '${callee}'`);
  // validate argument counts
  if (resolve.kind === Type.ClassDeclaration) {
    node.isClassCall = true;
    this.equalArgumentCount(
      callee,
      resolve.ctor.arguments, node.arguments
    );
  }
  else if (resolve.kind === Type.FunctionDeclaration) {
    this.equalArgumentCount(
      callee,
      node.arguments, resolve.arguments
    );
  }
  this.resolveType(node);
  let type = node.resolvedType.value;
  this.validateReturnType(node, type);
}

/**
 * @param {Node} node
 */
export function ConstructorDeclaration(node) {
  this.expectNodeKind(node, Type.ConstructorDeclaration);
  if (!node.parent.ctor) {
    node.parent.ctor = node;
  }
  // classes automatically inherit return
  // type by their class name
  if (node.parent.kind !== Type.ClassDeclaration) {
    this.resolveIdentifier(node.type.value);
  }
}

/**
 * @param {Node} node
 */
export function VariableDeclaration(node) {
  // is class property?
  if (node.parent !== null) {
    if (node.parent.kind === Type.ClassDeclaration) {
      node.isClassProperty = true;
    }
  }
  // make sure the variable type is defined
  this.resolveIdentifier(node.declaration.type.value);
}

/**
 * @param {Node} node
 */
export function BinaryExpression(node) {
  this.resolveType(node);
  let type = this.validateExpressionTypes(node).value;
  this.validateReturnType(node, type);
}

/**
 * @param {Node} node
 */
export function Literal(node) {
  //console.log(Token[node.type], node.value);
  this.resolveType(node);
  let type = node.resolvedType.value;
  this.validateReturnType(node, type);
}