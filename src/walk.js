/**
 * Luke ASTwalker
 * Recursively walks nodes,
 * trigger available node visitors
 */
import { TT, Type, Token } from "./token";

/**
 * @param {Node} node
 */
export function walk(node) {
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
    this.walkNode(array[ii], parent);
  };
}

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function walkNode(node, parent) {
  let kind = this.getNodeKindAsString(node);
  node.parent = parent;
  if (this[kind] !== void 0) {
    this[kind](node, parent);
    this.visit(node);
  }
  else this.throw(`'${kind}' type isnt supported yet`);
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
  this.walkArray(node.body, parent);
}

/**
 * @param {Node} node
 */
export function BinaryExpression(node) {
  this.expectNodeKind(node, Type.BinaryExpression);
  this.walkNode(node.left, node);
  this.walkNode(node.right, node);
}

/**
 * @param {Node} node
 */
export function Literal(node) {
  this.expectNodeKind(node, Type.Literal);
}

/**
 * @param {Node} node
 */
export function TypeExpression(node) {
  this.expectNodeKind(node, Type.TypeExpression);
  this.walkNode(node.name, node);
  this.walkNode(node.type, node);
}

/**
 * @param {Node} node
 */
export function MemberExpression(node) {
  this.expectNodeKind(node, Type.MemberExpression);
}

/**
 * @param {Node} node
 */
export function VariableDeclaration(node) {
  this.expectNodeKind(node, Type.VariableDeclaration);
  let symbol = TT[node.symbol].toLowerCase();
  // trace constants
  node.isConstant = node.symbol === TT.CONST;
  let decl = node.declaration;
  let name = this.isNodeKindOf(decl, Type.TypeExpression) ? decl.name.value : decl.value;
  decl.init = node.init;
  // already declared?
  this.alreadyDeclared(node);
  this.scope.register(name, decl);
  this.walkNode(decl.init, node);
}

/**
 * @param {Node} node
 */
export function ReturnStatement(node) {
  this.expectNodeKind(node, Type.ReturnStatement);
  this.walkNode(node.argument, node);
}

/**
 * @param {Node} node
 */
export function FunctionDeclaration(node) {
  this.expectNodeKind(node, Type.FunctionDeclaration);
  this.scope.register(node.name, node);
  this.pushScope(node);
  this.returnContext = node;
  this.walkArguments(node);
  this.walkNode(node.body, node);
  this.popScope();
}

/**
 * @param {Node} node
 */
export function CallExpression(node) {
  this.expectNodeKind(node, Type.CallExpression);
  this.walkParameters(node);
}

/**
 * @param {Node} node
 */
export function walkParameters(node) {
  let args = node.arguments;
  let ii = 0;
  let length = args.length;
  for (; ii < length; ++ii) {
    let arg = args[ii];
    if (this.states.SEMANTIC) {
      arg.isParameter = true;
      this.analyzeParameter(node, arg, ii);
    }
    this.walkNode(arg, node);
  };
}

/**
 * @param {Node} node
 */
export function walkArguments(node) {
  let args = node.arguments;
  let ii = 0;
  let length = args.length;
  for (; ii < length; ++ii) {
    let arg = args[ii];
    let name = this.isNodeKindOf(arg, Type.TypeExpression) ? arg.name.value : arg.value;
    this.scope.register(name, arg);
    arg.parent = node;
    arg.isArgument = true;
    this.walkNode(arg.name, arg);
  };
}

/**
 * @param {Node} node
 */
export function OperatorDeclaration(node) {
  this.expectNodeKind(node, Type.OperatorDeclaration);
  this.scope.register(node.operator, node);
  this.pushScope(node);
  this.walkNode(node.body, node);
  this.popScope();
}

/**
 * @param {Node} node
 */
export function PrecedenceExpression(node) {
  this.expectNodeKind(node, Type.PrecedenceExpression);
  if (node.parent.kind === Type.OperatorDeclaration) {
    node.parent.precedence = node.level;
  } else {
    this.throw(`Invalid PrecedenceExpression`);
  }
}

/**
 * @param {Node} node
 */
export function AssociativityExpression(node) {
  this.expectNodeKind(node, Type.AssociativityExpression);
  if (node.parent.kind === Type.OperatorDeclaration) {
    node.parent.associativity = node.associativity;
  } else {
    this.throw(`Invalid AssociativityExpression`);
  }
}

/**
 * @param {Node} node
 */
export function ClassDeclaration(node) {
  this.expectNodeKind(node, Type.ClassDeclaration);
  this.scope.register(node.name, node);
  this.pushScope(node);
  this.walkNode(node.body, node);
  this.popScope();
}

/**
 * @param {Node} node
 */
export function ConstructorDeclaration(node) {
  this.expectNodeKind(node, Type.ConstructorDeclaration);
  this.pushScope(node);
  this.returnContext = node;
  this.walkArguments(node);
  this.walkNode(node.body, node);
  this.popScope();
}

/**
 * @param {Node} node
 */
export function IfStatement(node) {
  this.expectNodeKind(node, Type.IfStatement);
  this.pushScope(node);
  if (node.test !== null) {
    this.walkNode(node.test, node);
  }
  if (node.consequent !== null) {
    this.walkNode(node.consequent, node);
  }
  if (node.alternate !== null) {
    this.walkNode(node.alternate, node);
  }
  this.popScope();
}

/**
 * @param {Node} node
 */
export function MemberExpression(node) {
  this.expectNodeKind(node, Type.MemberExpression);
  this.walkNode(node.object, node);
}