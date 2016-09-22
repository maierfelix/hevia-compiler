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
      node.resolvedType = this.validateExpressionTypes(node);
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
        this.throw(`Unsupported '${this.getNodeKindAsString(resolve)}' node type`);
      }
      this.resolveIdentifier(node.resolvedType.value);
    break;
    case Type.Literal:
      node.resolvedType = this.resolveLiteralType(node);
      this.resolveIdentifier(node.resolvedType.value);
    break;
    default:
      this.throw(`Unsupported '${this.getNodeKindAsString(node)}' node type`);
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
      return (this.validateBinaryExpressionType(node));
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
      this.throw(`Unsupported expression: '${this.getNodeKindAsString(node)}'`);
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
  if (!this.isNativeOperator(node)) {
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
  // native operator
  else {
    op = Operator[TT[node.operator]];
    let returns = (
      op.associativity === 2 ? leftType :
      op.associativity === 1 ? rightType :
      leftType
    );
    if (this.isAssignmentOperator(node)) {
      // only allow assignment to identifiers
      if (node.left.type !== Token.Identifier) {
        this.throw(`Cannot assign to a '${this.getNodeTypeAsString(node.left)}'`);
      }
      returnType = this.createFakeLiteral(returns);
      let resolve = this.scope.resolve(node.left.value);
      // assign expr type has to match identifier type
      if (resolve.type.value !== returnType.value) {
        this.throw(`Cannot assign value of type '${returnType.value}' to type '${resolve.type.value}'`);
      }
    } else {
      returnType = this.getNativeOperatorType(node);
    }
  }
  return (returnType);
}

/**
 * @param {Node} node
 * @return {Node}
 */
export function getNativeOperatorType(node) {
  let kind = node.operator;
  let returns = null;
  if (
    kind === TT.LT || kind === TT.LE ||
    kind === TT.GT || kind === TT.GE ||
    kind === TT.EQ || kind === TT.NEQ ||
    kind === TT.AND || kind === TT.OR
  ) {
    returns = this.createFakeLiteral("Boolean");
  }
  else {
    returns = this.createFakeLiteral("Int");
  }
  return (returns);
}

/**
 * @param {Node} node
 * @param {Node} arg
 * @param {Number} index
 */
export function resolveParameter(node, arg, index) {
  let callee = node.callee.value;
  let resolve = this.scope.resolve(callee);
  let args = null;
  if (resolve === null) {
    this.throw(`Cannot resolve call to '${callee}'`);
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
export function resolveReturnType(node, type) {
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