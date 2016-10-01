import { TT, Type, Token, Operator } from "../token";

/**
 * @param {Node} node
 */
export function CallExpression(node) {
  let callee = node.callee.value;
  let resolve = this.resolveIdentifier(callee);
  if (!resolve) this.throw(`Cannot resolve callee '${callee}'`);
  node.isClassCreation = resolve.kind === Type.ClassDeclaration;
  // validate argument counts
  if (node.isClassCreation) {
    this.validateArguments(
      callee,
      resolve.ctor.arguments, node.arguments,
      Type.ClassDeclaration
    );
  }
  else if (resolve.kind === Type.FunctionDeclaration) {
    this.validateArguments(
      callee,
      resolve.arguments, node.arguments,
      Type.FunctionDeclaration
    );
  }
  else {
    this.throw(`Unknown call ${this.getNodeKindAsString(resolve)}`);
  }
  this.resolveType(node);
  let type = node.resolvedType.value;
  this.resolveReturnType(node, type);
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
  let type = node.resolvedType.value;
  this.resolveReturnType(node, type);
}

/**
 * @param {Node} node
 */
export function MemberExpression(node) {
  this.resolveType(node);
  let type = node.resolvedType.value;
  this.resolveReturnType(node, type);
  node.isAbsolute = node.object.kind === Type.Literal;
}

/**
 * @param {Node} node
 */
export function Literal(node) {
  //console.log(Token[node.type], node.value);
  this.resolveType(node);
  let type = node.resolvedType.value;
  if (node.parent.kind === Type.BinaryExpression) {
    if (!this.isNativeOperator(node.parent)) {
      this.traceLaterOperatorReference(node);
    }
  }
  this.resolveReturnType(node, type);
}

/**
 * @param {Node} node
 */
export function IfStatement(node) {
  let isElse = !!(node.parent && node.parent.kind === Type.IfStatement && !node.test);
  if (node.test !== null) {
    this.resolveType(node.test);
    let type = node.test.resolvedType.value;
    if (type !== "Boolean") {
      this.throw(`IfStatement condition expected 'Boolean' but got '${type}'`);
    }
  }
}

/**
 * @param {Node} node
 */
export function ReturnStatement(node) {
  let expr = node.argument;
  this.resolveType(expr);
  let returnType = expr.resolvedType.value;
  if (!this.returnContext) {
    this.throw(`Invalid return context`);
  }
  let returnContext = this.returnContext.type.value;
  let target = this.getDeclarationName(this.returnContext);
  if (returnContext === "Void") {
    this.throw(`Unexpected return value in '${target}'`);
  }
  if (returnContext !== returnType) {
    this.throw(`'${target}' returns '${returnContext}' but got '${returnType}'`);
  }
  this.resolveReturnStatement(node);
}

/**
 * @param {Node} node
 */
export function TernaryExpression(node) {
  this.resolveType(node);
  let type = node.resolvedType.value;
  this.resolveReturnType(node, type);
}

/**
 * @param {Node} node
 */
export function FunctionDeclaration(node) {
  let type = node.type.value;
  if (type !== "Void" && !node.doesReturn) {
    this.throw(`Missing return '${type}' in function '${node.name}'`);
  }
}

/**
 * @param {Node} node
 */
export function OperatorDeclaration(node) {
  let type = node.ctor.type.value;
  if (type !== "Void" && !node.doesReturn) {
    this.throw(`Missing return '${type}' in operator '${node.operator}'`);
  }
}

/**
 * @param {Node} node
 */
export function ClassDeclaration(node) {
  let type = node.ctor.type.value;
  if (type !== "Void" && !node.doesReturn) {
    this.throw(`Missing return '${type}' in class '${node.name}'`);
  }
}