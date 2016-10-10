import {
  parseFakeLiteral,
  TT, Type, Token, Operator, Node
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
  let resolve = this.resolveIdentifier(name);
  // argument passed as parameter
  if (resolve.isArgument) return (resolve);
  return (
    resolve.init.parent
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
      node.resolvedType = this.resolveExpression(node);
    break;
    case Type.CallExpression:
      let resolve = null;
      let callee = node.callee.value;
      resolve = this.scope.resolve(callee);
      if (node.callee.kind === Type.Literal) {
        if (resolve.kind === Type.FunctionDeclaration) {
          node.resolvedType = resolve.type;
          this.validateArguments(
            callee,
            resolve.arguments, node.arguments,
            Type.FunctionDeclaration
          );
        }
        else if (resolve.kind === Type.ClassDeclaration) {
          node.resolvedType = this.createFakeLiteral(callee);
          this.validateArguments(
            callee,
            resolve.ctor.arguments, node.arguments,
            Type.ClassDeclaration
          );
          node.isInstantiatedClass = true;
          node.resolvedType.isInstantiatedClass = true;
        }
        else {
          this.throw(`Invalid call to '${this.getNodeKindAsString(resolve)}' node`, node);
        }
        this.resolveIdentifier(node.resolvedType.value);
      } else if (node.callee.kind === Type.MemberExpression) {
        this.resolveType(node.callee);
        node.resolvedType = node.callee.resolvedType;
      } else {
        this.throw(`Invalid callee node kind ${this.getNodeKindAsString(node.callee)}`);
      }
    break;
    case Type.Literal:
      node.resolvedType = this.resolveLiteral(node);
      this.resolveIdentifier(node.resolvedType.value);
      var resolve = this.scope.resolve(node.value);
      if (resolve && resolve.init && resolve.init.parent.isPseudo) {
        node.isPseudoAccess = true;
      }
      if (!node.isParameter && !node.isOperatorParameter) {
        let resolve = this.scope.resolve(node.value);
        if (resolve && resolve.init && resolve.init.parent.kind === Type.VariableDeclaration) {
          let parent = resolve.init.parent;
          if (!this.isNativeType(node.value)) {
            node.isReference = !!parent.declaration.isPointer;
          }
        }
      }
    break;
    case Type.MemberExpression:
      this.resolveType(node.object);
      node.resolvedType = this.resolveExpression(node);
    break;
    case Type.TernaryExpression:
      node.resolvedType = this.resolveExpression(node);
    break;
    default:
      this.throw(`Unsupported '${this.getNodeKindAsString(node)}' node type`, node);
    break;
  };
}

/**
 * @param {Node} node
 */
export function inferenceNodeType(node) {
  let resolve = this.scope.resolve(node.value);
  if (resolve.kind === Type.ClassDeclaration) {
    return (resolve.resolvedType);
  }
  if (resolve.kind === Type.EnumDeclaration) {
    resolve.resolvedType = this.createFakeLiteral(resolve.name.value);
    return (resolve.resolvedType);
  }
  if (resolve.kind === Type.Literal) {
    if (resolve.init.kind === Type.CallExpression) {
      resolve.resolvedType = resolve.init.resolvedType;
      return (resolve.resolvedType);
    }
    if (resolve.init.parent.kind === Type.VariableDeclaration) {
      return (resolve.init.resolvedType);
    }
    this.throw(`Cannot resolve '${this.getNodeKindAsString(node)}'`, node);
  }
  return (this.createFakeLiteral(resolve.init.resolvedType.value));
}

/**
 * @param {Node} node
 * @return {Node}
 */
export function resolveLiteral(node) {
  let resolve = this.scope.resolve(node.value);
  if (resolve !== null) {
    // enums are ints
    if (resolve.isEnumValue) {
      return (this.createFakeLiteral("Int"));
    }
    node.isReference = resolve.isReference;
    if (resolve.kind === Type.TypeExpression) {
      return (resolve.type);
    }
    // no type attached, so inference
    else {
      return (this.inferenceNodeType(node));
    }
  } else {
    if (node.type === Token.NumericLiteral) {
      return (this.createFakeLiteral(getType(node.value)));
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
export function resolveExpression(node) {
  switch (node.kind) {
    case Type.BinaryExpression:
      return (this.resolveBinaryExpression(node));
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
    case Type.MemberExpression:
      return (this.resolveMemberExpression(node));
    break;
    case Type.TernaryExpression:
      return (this.resolveTernaryExpression(node));
    break;
    default:
      this.throw(`Unsupported expression: '${this.getNodeKindAsString(node)}'`, node);
    break;
  };
}

/**
 * @param {Node} node
 * @return {Node}
 */
export function resolveTernaryExpression(node) {
  let test = node.test.resolvedType.value;
  let consequent = node.consequent.resolvedType.value;
  let alternate = node.alternate.resolvedType.value;
  if (test !== "Boolean") {
    this.throw(`'TernaryExpression' expected 'Boolean' as test, but got '${test}'`, node.test);
  }
  // result types have to match
  if (consequent !== alternate) {
    this.throw(`'TernaryExpression' has mismatching types '${consequent}' and '${alternate}'`, node);
  }
  return (node.consequent.resolvedType);
}

/**
 * @param {Node} node
 * @return {Node}
 */
export function resolveMemberExpression(node) {

  let object = node.object;
  let property = node.property;
  let isThis = this.isThisNode(object);

  let resolve = this.resolveExpression(object);
  let obj = this.scope.resolve(resolve.value);
  let name = object.property ? object.property.value : object.value;

  // object member
  if (!isThis) {
    if (!resolve || !obj) {
      this.throw(`'${name}' does not have member '${property.value}'`, property);
    }
    let returnType = this.resolveObjectMemberProperty(obj, property.value);
    if (!returnType) {
      this.throw(`'${obj.name}' does not have member '${property.value}'`, property);
    }
    // static class member access
    if (node.isAbsolute && obj.kind === Type.ClassDeclaration) {
      // prevent non static values from getting changed
      if (returnType.init.parent.isStatic !== true) {

        let resolveAbsolute = this.scope.resolve(name);
        // Direct static class member access
        if (resolveAbsolute.kind === Type.ClassDeclaration) {
          this.throw(`Cannot access non-static member '${name}.${property.value}'`, property);
        }

        if (!resolveAbsolute.isArgument) {
          let isInstantiatedClass = resolveAbsolute.init.resolvedType.isInstantiatedClass;
          if (!isInstantiatedClass) {
            this.throw(`Cannot access non-static member '${name}.${property.value}'`, property);
          }
        }

      }
    }
    if (returnType.isEnumValue) {
      return (returnType.resolvedType);
    }
    return (returnType.type);
  // inner static local variable access
  } else {
    let resolveAbsolute = this.scope.resolve(property.value);
    if (resolveAbsolute === null) {
      this.throw(`Cannot access uninitialized property '${property.value}'`, property);
    }
    if (resolveAbsolute.init && resolveAbsolute.init.parent !== null) {
      if (resolveAbsolute.init.parent.isStatic) {
        if (resolveAbsolute.init.parent.isClassProperty) {
          let name = resolveAbsolute.init.parent.parent.name;
          this.throw(`Cannot access uninitialized static property '${resolveAbsolute.name.value}' in class '${name}'`, property);
        }
      }
    }
  }

  // local member
  let context = this.getThisContext();
  let entry = context.table[property.value];
  if (!entry) {
    let name = isThis ? "this" : object.value;
    this.throw(`'${name}' does not have member '${property.value}'`, property);
  }

  if (entry.kind === Type.TypeExpression) {
    return (entry.type);
  } else if (entry.kind === Type.Literal) {
    return (entry.init.resolvedType);
  } else {
    this.throw(`Cannot resolve member of kind '${this.getNodeKindAsString(entry)}'`);
  }

}

/**
 * @param {Node} node
 * @param {String} property
 * @return {Node}
 */
export function resolveObjectMemberProperty(node, property) {
  switch(node.kind) {
    case Type.ClassDeclaration:
      for (let sub of node.body.body) {
        if (!(sub.isClassProperty)) continue;
        let name = null;
        let resolve = null;
        // allow functions and variables as members
        if (sub.kind === Type.VariableDeclaration) {
          name = sub.name.value;
        }
        else if (sub.kind === Type.FunctionDeclaration) {
          name = sub.name;
        }
        resolve = node.context.resolve(name);
        if (resolve) {
          if (resolve.kind === Type.Literal) {
            if (resolve.value === property) {
              return (resolve.init.parent.declaration);
            }
          } else {
            if (resolve.name.value === property) return (resolve);
            if (resolve.name === property) return (resolve);
          }
        }
      };
    break;
    case Type.EnumDeclaration:
      for (let key of node.keys) {
        if (key.value === property) {
          let resolve = this.scope.resolve(property);
          return (resolve);
        }
      };
    break;
    default:
      this.throw(`Unsupported member resolve node kind ${this.getNodeKindAsString(node)}`, node);
    break;
  }
  return (null);
}

/**
 * @param {Node} node
 * @return {Node}
 */
export function resolveBinaryExpression(node) {
  let returnType = null;
  let op = this.resolveOperator(node);
  let leftType = this.resolveExpression(node.left).value;
  let rightType = this.resolveExpression(node.right).value;
  // custom operator
  if (!this.isNativeOperator(node)) {
    returnType = op.ctor.type;
    let args = op.ctor.arguments;
    let left = args[0].type.value;
    let right = args[1].type.value;
    // prevent passing constants as inout
    if (args[0].isReference && this.isConstant(node.left.value)) {
      this.throw(`Constant '${node.left.value}' is immutable`, node.left);
    }
    // make sure left parameter is mutable (if inout)
    if (
      args[0].isReference &&
      node.left.type !== Token.Identifier
    ) this.throw(`Left side of ${op.operator} is not mutable`, node.left);
    if (left !== leftType) {
      this.throw(`Operator '${op.operator}' expected '${left}' but got '${leftType}'`, args[0]);
    }
    // make sure right parameter is mutable (if inout)
    if (
      args[1].isReference &&
      node.right.type !== Token.Identifier
    ) this.throw(`Right side of ${op.operator} is not mutable`, node.right);
    if (args[1].isReference && this.isConstant(node.right.value)) {
      this.throw(`Constant '${node.right.value}' is immutable`, node.right);
    }
    if (right !== rightType) {
      this.throw(`Operator '${op.operator}' expected '${right}' but got '${rightType}'`, args[1]);
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
      if (this.isConstant(node.left.value)) {
        this.throw(`Constant '${node.left.value}' is immutable`, node.left);
      }
      let resolve = null;
      let leftIsMember = node.left.kind === Type.MemberExpression;
      // only allow assignment to identifiers and members
      if (node.left.type !== Token.Identifier && !leftIsMember) {
        let msg = this.isThisNode(node.left) ? "this" : this.getNodeTypeAsString(node.left);
        this.throw(`Cannot assign to '${msg}'`, node.left);
      }
      returnType = this.createFakeLiteral(returns);
      if (leftIsMember) {
        resolve = node.left.resolvedType;
      } else {
        resolve = this.scope.resolve(node.left.value);
        if (resolve && resolve.kind === Type.ClassDeclaration) {
          this.throw(`'${resolve.name}' is immutable`, node.left);
        }
        if (resolve.kind === Type.TypeExpression) {
          resolve = resolve.type;
        } else {
          resolve = resolve.init.resolvedType;
        }
      }
      // assign expr type has to match identifier type
      if (resolve.value !== returnType.value) {
        this.throw(`Cannot assign value of type '${returnType.value}' to type '${resolve.value}'`, node);
      }
    } else {
      returnType = this.getNativeOperatorType(node);
    }
  }
  return (returnType);
}

/**
 * @param {Node} node
 */
export function resolveReturnStatement(node) {
  let ctx = this.returnContext;
  if (ctx === null) {
    this.throw(`Return statement outside of valid context`, node);
  }
  if (ctx.kind === Type.ConstructorDeclaration) {
    ctx = ctx.parent;
  }
  ctx.doesReturn = true;
}

/**
 * @param {Node} node
 * @param {Node} arg
 * @param {Number} index
 */
export function resolveParameter(node, arg, index) {
  let callee = node.callee.value;
  if (node.callee.kind === Type.MemberExpression) {
    this.resolveType(node.callee);
    return void 0;
  }
  let resolve = this.scope.resolve(callee);
  let args = null;
  if (resolve === null) {
    this.throw(`Cannot resolve call to '${callee}'`, node.callee);
  }
  if (resolve.kind === Type.FunctionDeclaration) {
    args = resolve.arguments;
  } else if (resolve.kind === Type.ClassDeclaration) {
    args = resolve.ctor.arguments;
  }
  if (args[index] === void 0) {
    this.throw(`Too much arguments provided for '${callee}'`, node.callee);
  }
  let isReference = args[index].isReference;
  if (isReference) {
    // only allow identifiers as inout argument
    if (arg.type !== Token.Identifier) {
      this.throw(`Argument '${args[index].name.value}' of '${callee}' is not mutable`, args[index].name);
    }
    let resolvedVariable = this.resolveVariableDeclaration(arg.value);
    let isConstant = resolvedVariable.isConstant;
    // dont allow constants as inout argument
    if (isConstant) {
      this.throw(`Cannot pass immutable '${arg.value}' as reference`, arg);
    }
  }
}

/**
 * @param {Node} node
 * @param {Object} operator
 */
export function resolveCustomOperatorExpression(node, operator) {
  let resolveOperator = this.scope.resolve(operator.op);
  let ctor = resolveOperator.ctor;
  let left = ctor.arguments[0];
  let right = ctor.arguments[1];
  // only allow identifiers as inout arguments
  if (left.isReference) {
    if (node.left.type !== Token.Identifier) {
      this.throw(`'Left' argument of '${ctor.parent.operator}' is not mutable`, node.left);
    }
    let resolve = this.isConstantLiteral(node.left);
    if (resolve) {
      this.throw(`Cannot pass immutable '${node.left.value}' as reference`, node.left);
    }
    node.left.isOperatorParameter = true;
    this.traceAsPointer(node.left);
  }
  if (right.isReference) {
    if (node.right.type !== Token.Identifier) {
      this.throw(`'Right' argument of '${ctor.parent.operator}' is not mutable`, node.right);
    }
    let resolve = this.isConstantLiteral(node.right);
    if (resolve) {
      this.throw(`Cannot pass immutable '${node.right.value}' as reference`, node.right);
    }
    node.right.isOperatorParameter = true;
    this.traceAsPointer(node.right);
  }
}

/**
 * @param {Node} node
 */
export function resolveReturnType(node, type) {
  let parent = node.parent;
  if (!parent) return void 0;
  if (parent.kind === Type.VariableDeclaration) {
    let declaration = parent.declaration;
    let inferencedType = declaration.init.resolvedType;
    let parentType = declaration.type.value;
    if (parent.hasInferencedType) {
      parentType = inferencedType.value;
    }
    // assign to null is allowed
    if (type === "Null") return void 0;
    if (parentType !== type) {
      this.throw(`'${declaration.name.value}' expected '${parentType}' but got '${type}'`, node);
    }
  }
}