import {
  parseFakeLiteral,
  TT, Type, Token, Operator
} from "../token";

import {
  getType
} from "../utils";

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
  if (resolve) resolve.isLaterPointer = true;
}

/**
 * @param {Node} node
 * @param {Node} arg
 * @param {Number} index
 */
export function traceLaterReferences(node, arg, index) {
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
 * @param {Node} arg
 * @param {Number} index
 */
export function compileParameter(node, arg, index) {
  this.validateParameter(node, arg, index);
  this.traceLaterReferences(node, arg, index);
}

/**
 * @param {Node} node
 * @param {Node} arg
 * @param {Number} index
 */
export function validateParameter(node, arg, index) {
  let callee = node.callee.value;
  let resolve = this.scope.resolve(callee);
  let args = null;
  if (resolve === null) {
    this.throw(`Can't resolve call to '${callee}'`);
  }
  if (resolve.kind === Type.FunctionDeclaration) {
    args = resolve.arguments;
  }
  else if (resolve.kind === Type.ClassDeclaration) {
    args = resolve.ctor.arguments;
  }
  let isReference = args[index].isReference;
  if (isReference) {
    // only allow identifiers as inout argument
    if (arg.type !== Token.Identifier) {
      this.throw(`Argument '${args[index].name.value}' of ${callee}' is not mutable`);
    }
    let resolvedVariable = this.resolveVariableDeclaration(arg.value);
    let isContant = this.scope.resolve(arg.value).init.parent.isConstant;
    // disallow constants as inout argument
    if (isContant) {
      this.throw(`Cannot pass immutable '${arg.value}' as reference`);
    }
  }
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
 * @param {String} callee
 * @param {Number} lengthA
 * @param {Number} lengthB
 */
export function equalArgumentCount(callee, argsA, argsB) {
  if (argsA.length < argsB.length) {
    this.throw(`Too many arguments provided for '${callee}'`);
  }
  else if (argsA.length > argsB.length) {
    this.throw(`Not enough arguments provided for '${callee}'`);
  }
}

/**
 * @param {Node} node
 */
export function validateReturnType(node, type) {
  let parent = node.parent;
  if (parent && parent.kind === Type.VariableDeclaration) {
    let declaration = parent.declaration;
    let parentType = declaration.type.value;
    // assign to null is allowed
    if (type === "Null") return void 0;
    if (parentType !== type) {
      this.throw(`'${declaration.name.value}' expected '${parentType}' but got '${type}'`);
    }
  }
}