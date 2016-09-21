import {
  parseFakeLiteral,
  TT, Type, Token, Operator
} from "../token";

import {
  getType
} from "../utils";

/**
 * @param {Node} node
 * @return {Node}
 */
export function resolveOperator(node) {
  return (this.scope.resolve(TT[node.operator]) || null);
}

/**
 * @param {String} name
 * @return {Node}
 */
export function resolveIdentifier(name) {
  if (this.isNativeType(name)) {
    let type = this.createFakeLiteral(name);
    type.isNative = true;
    return (type);
  }
  let resolve = this.scope.resolve(name);
  if (resolve === null) this.throw(`'${name}' is not defined`);
  return (resolve);
}

/**
 * @param {String} name
 * @return {Node}
 */
export function resolveVariableDeclaration(name) {
  let identifier = this.resolveIdentifier(name);
  return (
    identifier.init.parent
  );
}

/**
 * @param {Node} node
 */
export function resolveType(node) {
  switch (node.kind) {
    case Type.BinaryExpression:
      this.resolveType(node.left);
      this.resolveType(node.right);
    break;
    case Type.CallExpression:
      let callee = node.callee.value;
      let resolve = this.scope.resolve(callee);
      if (resolve.kind === Type.FunctionDeclaration) {
        node.resolvedType = resolve.type;
      }
      else if (resolve.kind === Type.ClassDeclaration) {
        node.resolvedType = this.createFakeLiteral(callee);
      }
      else {
        this.throw(`Unsupported '${this.getNodeTypeAsString(resolve)}' node type`);
      }
      this.resolveIdentifier(node.resolvedType.value);
    break;
    case Type.Literal:
      node.resolvedType = this.resolveLiteralType(node);
      this.resolveIdentifier(node.resolvedType.value);
    break;
    default:
      this.throw(`Unsupported '${this.getNodeTypeAsString(node)}' node type`);
    break;
  };
}

/**
 * @param {Node} node
 * @return {String}
 */
export function resolveLiteralType(node) {
  let resolve = this.scope.resolve(node.value);
  if (resolve !== null) {
    if (resolve.kind === Type.TypeExpression) {
      return (resolve.type);
    }
    else {
      return (this.createFakeLiteral(node.value));
    }
  } else {
    if (node.type === Token.NumericLiteral) {
      return (this.createFakeLiteral(getType(parseFloat(node.value))));
    }
    else if (node.type === Token.StringLiteral) {
      return (this.createFakeLiteral("String"));
    }
    else if (node.type === Token.BooleanLiteral) {
      return (this.createFakeLiteral("Boolean"));
    }
    else if (node.type === Token.NullLiteral) {
      return (this.createFakeLiteral("Null"));
    }
    return (this.createFakeLiteral(node.value));
  }
}

/**
 * @param {String} value
 * @return {String}
 */
export function createFakeLiteral(value) {
  return (parseFakeLiteral(value));
}

/**
 * @param {Node} node
 * @return {Node}
 */
export function validateExpressionTypes(node) {
  switch (node.kind) {
    case Type.BinaryExpression:
      let expr = this.validateBinaryExpressionType(node);
      return (expr);
    break;
    case Type.Literal:
      // make sure identifiers are defined
      if (node.type === Token.Identifier) {
        this.resolveIdentifier(node.value);
      }
      return (node.resolvedType);
    break;
    case Type.CallExpression:
      return (node.resolvedType);
    break;
    default:
      this.throw(`Unsupported expression: '${this.getNodeTypeAsString(node)}'`);
    break;
  };
}

/**
 * @param {Node} node
 * @return {Node}
 */
export function validateBinaryExpressionType(node) {
  let returnType = null;
  let op = this.resolveOperator(node);
  let leftType = this.validateExpressionTypes(node.left).value;
  let rightType = this.validateExpressionTypes(node.right).value;
  // custom operator
  if (op !== null) {
    returnType = op.ctor.type;
    let args = op.ctor.arguments;
    let left = args[0].type.value;
    let right = args[1].type.value;
    if (left !== leftType) {
      this.throw(`Operator '${op.operator}' expected '${left}' but got '${leftType}'`);
    }
    if (right !== rightType) {
      this.throw(`Operator '${op.operator}' expected '${right}' but got '${rightType}'`);
    }
  }
  // FIXME
  else {
    op = Operator[TT[node.operator]];
    return (this.createFakeLiteral("Int"));
  }
  return (returnType);
}