import {
  parseFakeLiteral,
  TT, Type, Token, Operator
} from "../token";

import {
  getType
} from "../utils";

/**
 * @param {Node} node
 * @param {Number} kind
 */
export function resolveUpUntil(node, kind) {
  let parent = node;
  while (true) {
    if ((parent = parent.parent) === null) break;
    if (parent.kind === kind) break;
  };
  return (parent);
}

/**
 * @param {Node} node
 */
export function alreadyDeclared(node) {
  let name = node.name.value;
  let resolve = this.scope.resolve(name);
  if (resolve !== null) {
    this.throw(`'${name}' has already been declared`);
  }
}

/**
 * @param {Node} node
 */
export function traceAsPointer(node) {
  let resolve = null;
  if (node.kind === Type.Literal) {
    resolve = this.resolveIdentifier(node.value);
  } else if (node.kind === Type.TypeExpression) {
    resolve = this.resolveIdentifier(node.type.value);
  }
  if (resolve) resolve.isPointer = true;
}

/**
 * @param {Node} node
 * @param {Node} arg
 * @param {Number} index
 */
export function traceLaterParameterReference(node, arg, index) {
  let callee = node.callee;
  let resolve = this.scope.resolve(callee.value);
  let args = null;
  if (resolve.kind === Type.FunctionDeclaration) {
    args = resolve.arguments;
  }
  else if (resolve.kind === Type.ClassDeclaration) {
    args = resolve.ctor.arguments;
  }
  let isReference = args[index].isReference;
  // func argument is inout
  if (isReference) this.traceAsPointer(arg);
}

/**
 * @param {Node} node
 */
export function traceLaterOperatorReference(node) {
  let parent = node.parent;
  let left = parent.left;
  let right = parent.right;
  let operator = this.getOperatorByKind(parent.operator);
  if (operator !== null) {
    this.resolveCustomOperatorExpression(parent, operator);
  }
}

/**
 * @param {Node} node
 * @param {Node} arg
 * @param {Number} index
 */
export function analyzeParameter(node, arg, index) {
  this.resolveParameter(node, arg, index);
  this.traceLaterParameterReference(node, arg, index);
}

/**
 * @param {String} callee
 * @param {Number} lengthA
 * @param {Number} lengthB
 */
export function validateArguments(callee, argsA, argsB) {
  if (argsA.length < argsB.length) {
    this.throw(`Too many arguments provided for '${callee}'`);
  }
  else if (argsA.length > argsB.length) {
    this.throw(`Not enough arguments provided for '${callee}'`);
  }
  // make sure passed args have correct type
  let index = 0;
  for (let key of argsA) {
    let typeA = key.type.value;
    let typeB = argsB[index].resolvedType.value;
    if (typeA !== typeB) {
      this.throw(`'${callee}::${key.name.value}' expected '${typeA}' but got '${typeB}'`);
    }
    ++index;
  };
}

/**
 * @param {Node} node
 * @return {String}
 */
export function getDeclarationName(node) {
  switch (node.kind) {
    case Type.FunctionDeclaration:
      return (node.name);
    break;
    case Type.ConstructorDeclaration:
      let parent = node.parent;
      if (parent.kind === Type.OperatorDeclaration) {
        return (parent.operator);
      }
      else if (parent.kind === Type.ClassDeclaration) {
        return (parent.name);
      }
      else {
        this.throw(`Unexpected declaration node '${this.getNodeKindAsString(parent)}'`);
      }
    break;
  };
}

/**
 * @return {Scope}
 */
export function getThisContext() {
  return (
    this.returnContext.parent.context
  );
}