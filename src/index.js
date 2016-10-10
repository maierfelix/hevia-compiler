import fs from "fs";
import vm from "vm";
import cmd from "./cli";
import hevia from "./syntax";
import Scope from "./semantic/scope";

import { VERSION } from "./cfg";
import { greet, inherit } from "./utils";
import { TT, Type, Token, Operator } from "./token";

import * as _walk from "./walk";

import * as _semantic from "./semantic";
import * as _semantic_visit from "./semantic/visit";
import * as _semantic_resolve from "./semantic/resolve";

import * as _optimization from "./optimization";
import * as _optimization_rename from "./optimization/rename";

import * as _synthesis from "./synthesis";

/**
 * @class Compiler
 */
class Compiler {

  /** @constructor */
  constructor() {

    this.padding = 0;

    this.content = "";

    this.scope = null;
    this.returnContext = null;

    this.ast = null;

    this.pathScope = null;

    /**
     * Used to determine
     * double compilation
     * @type {Boolean}
     */
    this.compiled = false;

    this.visitors = {};

    this.currentState = null;
    this.states = {
      SEMANTIC: false,
      OPTIMIZATION: false,
      SYNTHESIS: false
    };

    this.insideClass = false;

  }

  /**
   * @param {Node} node
   */
  pushScope(node) {
    node.context = new Scope(node, this.scope);
    this.scope = node.context;
  }

  popScope() {
    this.scope = this.scope.parent;
  }

  /**
   * @param {String} msg
   */
  write(str) {
    this.content += str;
  }

  /**
   * @param {String} msg
   */
  writeInject(str) {
    this.write(";");
    this.write("\n");
    this.writeIndent();
    this.write(str);
  }

  indent() {
    this.padding++;
  }

  outdent() {
    this.padding--;
  }

  writeIndent() {
    let ii = this.padding;
    while (ii > 0) {
      ii--;
      this.write("  ");
    };
  }

  /**
   * @param {Number} op
   * @return {Object}
   */
  getOperatorByKind(op) {
    let token = TT[op];
    return (Operator[token] || null);
  }

  /**
   * @param {Node} node
   * @return {Boolean}
   */
  isConstantLiteral(node) {
    let resolve = this.resolveVariableDeclaration(node.value);
    return (!!resolve.isConstant);
  }

  /**
   * @param {String} msg
   */
  throw(msg, node) {
    if (node) {
      let loc = node.loc.start;
      msg += " " + loc.line + ":" + loc.column;
    }
    let str = `\x1b[31;1m${msg}\x1b[0m`;
    console.log(this.content);
    throw new Error(str);
  }

  /**
   * @param {String} msg
   * @param {Number} cc
   */
  print(msg, cc) {
    let str = `\x1b[${cc};1m${msg}\x1b[0m`;
    console.log(str);
  }

  /**
   * @param {Node} node
   * @return {String}
   */
  getNodeKindAsString(node) {
    return (Type[node.kind]);
  }

  /**
   * @param {Node} node
   * @return {String}
   */
  getNodeTypeAsString(node) {
    return (Token[node.type]);
  }

  /**
   * @param {Node} node
   * @param {Number} kind
   */
  isNodeKindOf(node, kind) {
    return (
      node.kind === kind
    );
  }

  /**
   * @param {Node} node
   * @return {Boolean}
   */
  isIdentifier(node) {
    return (
      node.type === Token.Identifier
    );
  }

  /**
   * @param {Node} node
   * @return {Boolean}
   */
  isGlobal(node) {
    return (
      node.parent === null
    );
  }

  /**
   * @param {Node} node
   * @return {Boolean}
   */
  isThisNode(node) {
    return (
       node.value << 0 === TT.THIS
    );
  }

  /**
   * @param {String} name
   * @return {Boolean}
   */
  isConstant(name) {
    let resolve = this.scope.resolve(name);
    if (resolve && resolve.init) {
      let parent = resolve.init.parent;
      if (parent.kind === Type.VariableDeclaration) {
        return (parent.isConstant);
      }
    }
    return (false);
  }

  /**
   * @param {Node} node
   * @return {Node}
   */
  getNativeOperatorType(node) {
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
   * @param {Number} op
   */
  getOperatorAsString(op) {
    let operator = this.getOperatorByKind(op);
    return (
      operator.operator || operator.op
    );
  }

  /**
   * @param {String} name
   * @return {Boolean}
   */
  isNativeType(name) {
    switch (name) {
      case "Void":
      case "Null":
      case "Int":
      case "Int8":
      case "Uint8":
      case "Int32":
      case "Int64":
      case "Uint64":
      case "Double":
      case "Float":
      case "Boolean":
      case "String":
      case "Character":
        return (true);
      break;
      default:
        return (false);
      break;
    };
  }

  /**
   * @param {Node} node
   * @return {Boolean}
   */
  isNativeOperator(node) {
    let op = node.operator;
    switch (op) {
      case TT.MUL:
      case TT.DIV:
      case TT.MOD:
      case TT.ADD:
      case TT.SUB:
      case TT.LT:
      case TT.LE:
      case TT.GT:
      case TT.GE:
      case TT.EQ:
      case TT.NEQ:
      case TT.AND:
      case TT.OR:
      case TT.NOT:
      case TT.UNARY_ADD:
      case TT.UNARY_SUB:
        return (true);
      break;
      default:
        return (
          this.isAssignmentOperator(node)
        );
      break;
    };
  }

  /**
   * @param {Node} node
   * @return {Boolean}
   */
  isAssignmentOperator(node) {
    let op = node.operator;
    switch (op) {
      case TT.ASSIGN:
      case TT.CMP_MUL:
      case TT.CMP_DIV:
      case TT.CMP_MOD:
      case TT.CMP_ADD:
      case TT.CMP_SUB:
        return (true);
      break;
      default:
        return (false);
      break;
    };
  }

  /**
   * @param {Node} node
   * @param {Number} kind
   */
  expectNodeKind(node, kind) {
    if (!this.isNodeKindOf(node, kind)) {
      let nodeKind = this.getNodeKindAsString(node);
      let expKind = Type[kind];
      let msg = `Invalid node kind! Expected '${expKind}' but got '${nodeKind}'`;
      this.throw(msg, node);
    }
  }

  /**
   * @param {Node} node
   * @param {String} property
   */
  expectNodeProperty(node, property) {
    if (!node.hasOwnProperty(property)) {
      let msg = `'${this.getNodeKindAsString(node)}' doesn't have property '${property}'`;
      this.throw(msg, node);
    }
  }

  /**
   * @param {String} msg
   * @param {String} target
   */
  compile(str, target) {
    let index = cmd.path.lastIndexOf("/");
    this.pathScope = cmd.path.substring(0, index + 1);
    if (!target in _synthesis) {
      this.throw(`Target '${target}' is unsupported`);
    }
    inherit(Compiler, _synthesis[target]);
    let ast = this.parse(str);
    this.ast = ast;
    this.enterPhase(ast, "semantic");
    this.compiled = true;
    // a second time to trace pointers
    this.enterPhase(ast, "semantic");
    this.enterPhase(ast, "optimization", false);
    this.enterPhase(ast, "synthesis", false);
    this.ozProgram(ast);
    this.emitProgram(ast);
    console.log("----------------");
    console.log(this.content);
    console.log("=>", vm.runInNewContext(this.content, {}));
  }

  resetStates() {
    let states = this.states;
    states.SEMANTIC = false;
    states.OPTIMIZATION = false;
    states.SYNTHESIS = false;
  }

  enterPhase(ast, state, walk) {
    this.currentState = state.toLowerCase();
    this.resetStates();
    this.states[state.toUpperCase()] = true;
    if (walk !== false) this.walk(ast);
  }

  /**
   * @param {String} msg
   * @return {Node}
   */
  parse(str) {
    let tokens = hevia.tokenize(str);
    let ast = hevia.parse(tokens);
    return (ast);
  }

  /**
   * @param {Node} node
   */
  visit(node) {
    let visitor = this.visitors[this.currentState];
    if (visitor[node.kind] !== void 0) {
      visitor[node.kind].apply(this, [node]);
    }
  }

  /**
   * @param {Object} visitors
   * @param {String} kind
   */
  registerVisitors(visitors, kind) {
    if (!this.visitors[kind]) this.visitors[kind] = {};
    for (let key in visitors) {
      this.visitors[kind][Type[key]] = visitors[key];
    };
  }

}

greet();

inherit(Compiler, _walk);
inherit(Compiler, _semantic);
inherit(Compiler, _semantic_resolve);
inherit(Compiler, _optimization);
inherit(Compiler, _optimization_rename);

const compiler = new Compiler();

compiler.registerVisitors(_semantic_visit, "semantic");

try {
  compiler.compile(cmd.input, "js");
} catch (e) {
  //console.log(e.message);
  console.log(e);
}

export default compiler;