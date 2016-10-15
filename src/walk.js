/**
 * Luke ASTwalker
 * Recursively walks nodes,
 * trigger available node visitors
 */
import fs from "fs";
import { TT, Type, Token } from "./token";
import { getUid } from "./utils";

/**
 * @param {Node} node
 */
export function walk(node) {
  this.expectNodeKind(node, Type.Program);
  this.pushScope(node);
  this.walkNode(node, node);
  this.popScope();
}

/**
 * @param {Array} array
 * @param {Node} parent
 */
export function walkArray(array, parent) {
  let ii = 0;
  for (; ii < array.length; ++ii) {
      let node = array[ii];
      this.walkNode(node, parent);
      // special case import declaration go one
      // backwards, so no new inserted node by import
      // declaration got missing to get walked over
      if (node.kind === Type.ImportDeclaration) {
        ii--;
      }
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
  else this.throw(`'${kind}' type isnt supported yet`, node);
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
  // TODO:
  // handle left right inout args same as function inout args
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
export function VariableDeclaration(node) {
  this.expectNodeKind(node, Type.VariableDeclaration);
  let symbol = TT[node.symbol].toLowerCase();
  // trace constants
  node.isConstant = node.symbol === TT.CONST;
  let decl = node.declaration;
  let name = this.isNodeKindOf(decl, Type.TypeExpression) ? decl.name.value : decl.value;
  decl.init = node.init;
  node.hasInferencedType = decl.kind === Type.TypeExpression ? false : true;
  node.name = !node.hasInferencedType ? decl.name : decl;
  // already declared?
  if (!this.compiled) this.alreadyDeclared(node);
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
  let tmpCtx = this.returnContext;
  this.returnContext = node;
  this.walkArguments(node);
  this.walkNode(node.body, node);
  this.returnContext = tmpCtx;
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
      //this.analyzeParameter(node, arg, ii);
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
  // TODO:
  // Search for first or second argument assignment
  // only direct assignment possible, since argument is passed
  // by reference
  // If true, then mark operator declaration node as
  // assignment operator
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
    this.throw(`Invalid PrecedenceExpression`, node);
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
    this.throw(`Invalid AssociativityExpression`, node);
  }
}

/**
 * @param {Node} node
 */
export function ClassDeclaration(node) {
  this.expectNodeKind(node, Type.ClassDeclaration);
  this.scope.register(node.name, node);
  this.pushScope(node);

  // move constructor to very last position, so it
  // has always access to all local instance members
  let body = node.body.body;
  let item = null;
  let tmp = null;
  for (let ii = 0; ii < body.length; ++ii) {
    item = body[ii];
    if (item.kind === Type.ConstructorDeclaration) {
      body.splice(ii, 1);
      body.push(item);
    }
  };
  let count = 0;
  // prevent definition of multiple constructors
  body.map((item) => {
    if (item.kind === Type.ConstructorDeclaration) count++;
    if (count > 1) this.throw(`Invalid redeclaration of '${parent.name}' constructor`, item);
  });

  this.walkNode(node.body, node);
  this.popScope();
}

/**
 * @param {Node} node
 */
export function EnumDeclaration(node) {
  this.expectNodeKind(node, Type.EnumDeclaration);
  this.expectNodeKind(node.name, Type.Literal);
  this.scope.register(node.name.value, node);
  for (let key of node.keys) {
    let isPureKey = key.kind !== Type.BinaryExpression;
    let register = !isPureKey ? key.left : key;
    if (register.kind !== Type.Literal) {
      this.throw(`Expected 'Literal' enum key but got '${this.getNodeKindAsString(register)}'`);
    }
    register.isEnumValue = true;
    this.scope.register(register.value, {
      isEnum: true,
      key: register,
      expression: key
    });
    this.walkNode(key, node);
  };
}

/**
 * @param {Node} node
 */
export function ConstructorDeclaration(node) {
  this.expectNodeKind(node, Type.ConstructorDeclaration);
  this.pushScope(node);
  let tmpCtx = this.returnContext;
  this.returnContext = node;
  this.walkArguments(node);
  this.walkNode(node.body, node);
  this.returnContext = tmpCtx;
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
    this.pushScope(node);
    this.walkNode(node.consequent, node);
    this.popScope();
  }
  if (node.alternate !== null) {
    this.pushScope(node);
    if (node.alternate.kind === Type.IfStatement) {
      node.alternate.isAlternateIf = true;
    }
    this.walkNode(node.alternate, node);
    this.popScope();
  }
  this.popScope();
}

/**
 * @param {Node} node
 */
export function MemberExpression(node) {
  this.expectNodeKind(node, Type.MemberExpression);
  // seems like we got an enum
  if (node.object === null) {
    let property = node.property;
    let resolve = this.scope.resolve(property.value);
    if (resolve && resolve.isEnumValue) {
      let isExpression = resolve.parent.kind === Type.BinaryExpression;
      node.object = isExpression ? resolve.parent.parent.name : resolve.parent.name;
    } else {
      this.throw(`Cannot resolve enum '${property.value}' key`);
    }
  }
  this.walkNode(node.object, node);
}

/**
 * @param {Node} node
 */
export function TernaryExpression(node) {
  this.expectNodeKind(node, Type.TernaryExpression);
  this.walkNode(node.test, node);
  this.walkNode(node.consequent, node);
  this.walkNode(node.alternate, node);
}

/**
 * @param {Node} node
 */
export function UnaryExpression(node) {
  this.expectNodeKind(node, Type.UnaryExpression);
  this.walkNode(node.argument, node);
}

/**
 * @param {Node} node
 */
export function PseudoProperty(node) {
  this.expectNodeKind(node, Type.PseudoProperty);
  this.pushScope(node);
  let tmpCtx = this.returnContext;
  this.returnContext = node.parent.declaration;
  this.walkArguments(node);
  this.walkNode(node.body, node);
  this.returnContext = tmpCtx;
  this.popScope();
}

/**
 * @param {Node} node
 */
export function WhileStatement(node) {
  this.expectNodeKind(node, Type.WhileStatement);
  this.walkNode(node.test, node);
  this.pushScope(node);
  this.walkNode(node.body, node);
  this.popScope();
}

/**
 * @param {Node} node
 */
export function BreakStatement(node) {
  this.expectNodeKind(node, Type.BreakStatement);
}

/**
 * @param {Node} node
 */
export function ContinueStatement(node) {
  this.expectNodeKind(node, Type.ContinueStatement);
}

/**
 * @param {Node} node
 */
export function ImportDeclaration(node) {
  if (node.hasOwnProperty("hash")) return void 0;
  node.hash = getUid();
  let nodes = [];
  node.specifiers.map((item) => {
    if (item.kind !== Type.Literal) {
      this.throw(`Invalid import specifier of kind ${this.getNodeKindAsString(item)}`);
    }
    let value = item.value;
    value = value.substring(1, value.length - 1);
    let path = this.pathScope + value;
    let isDir = false;
    try {
      isDir = fs.lstatSync(path).isDirectory();
    } catch (e) { };
    let ext = ".hevia";
    let src = fs.readFileSync(path + (isDir ? "/index" + ext : ext));
    // navigate into the directory
    if (isDir) this.pathScope += value + "/";
    let ast = this.parse(src);
    for (let key of ast.body.body) {
      nodes.push(key);
    };
    this.print(`Imported '${path}'`, 32);
  });
  let ii = 0;
  let absolute = this.resolveUpUntil(node, Type.Program);
  let body = absolute.body.body;
  for (; ii < body.length; ++ii) {
    if (body[ii].hash === node.hash) {
      body.splice(ii, 1);
      let kk = nodes.length - 1;
      // insert backwards to stay in correct order
      for (; kk >= 0; --kk) {
        body.unshift(nodes[kk]);
      };
      break;
    }
  };
}