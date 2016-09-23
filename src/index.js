import fs from "fs";
import vm from "vm";
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
import * as _optimization_visit from "./optimization/visit";

import * as _synthesis from "./synthesis";
import * as _synthesis_visit from "./synthesis/visit";

import cmd from "./cli";

/**
 * @class Compiler
 */
class Compiler {

  /** @constructor */
  constructor() {

    this.padding = 0;
    this.spacing = 2;

    this.content = "";

    this.scope = null;
    this.returnContext = null;

    this.ast = null;

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

  }

  /**
   * @param {Node} node
   */
  pushScope(node) {
    if (!this.compiled) {
      node.context = new Scope(node, this.scope);
    }
    this.scope = node.context;
  }

  popScope() {
    this.scope = this.scope.parent;
  }

  /**
   * @param {String} msg
   */
  write(str) {
    if (this.compiled) this.content += str;
  }

  indent() {
    if (this.compiled) this.padding++;
  }

  outdent() {
    if (this.compiled) this.padding--;
  }

  writeIndent() {
    let ii = this.padding;
    while (ii > 0) {
      ii -= this.spacing;
      let spaces = this.spacing;
      while (spaces-- > 0) this.write(" ");
    };
  }

  /**
   * @param {Number} op
   * @return {Object}
   */
  getOperatorByKind(op) {
    let token = TT[op];
    return (Operator[token]);
  }

  /**
   * @param {String} msg
   */
  throw(msg) {
    let str = `\x1b[31;1m${msg}\x1b[0m`;
    throw new Error(str);
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
      this.throw(msg);
    }
  }

  /**
   * @param {Node} node
   * @param {String} property
   */
  expectNodeProperty(node, property) {
    if (!node.hasOwnProperty(property)) {
      let msg = `'${this.getNodeKindAsString(node)}' doesn't have property '${property}'`;
      this.throw(msg);
    }
  }

  /**
   * @param {String} msg
   * @param {String} target
   */
  compile(str, target) {
    if (!target in _synthesis) {
      this.throw(`Target '${target}' is unsupported`);
    }
    this.ast = this.parse(str);
    this.ast = this.parse(str);
    this.enterPhase("semantic");
    this.enterPhase("optimization");
    this.enterPhase("synthesis");
    console.log("----------------");
    console.log(this.content);
    //console.log("=>", vm.runInNewContext(this.content, {}));
  }

  resetStates() {
    let states = this.states;
    states.SEMANTIC = false;
    states.OPTIMIZATION = false;
    states.SYNTHESIS = false;
  }

  enterPhase(state) {
    this.currentState = state.toLowerCase();
    this.resetStates();
    this.states[state.toUpperCase()] = true;
    this.walk(this.ast);
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

const compiler = new Compiler();

compiler.registerVisitors(_semantic_visit, "semantic");
compiler.registerVisitors(_optimization_visit, "optimization");
compiler.registerVisitors(_synthesis_visit, "synthesis");

try {
  compiler.compile(cmd.input, "js");
} catch (e) {
  //console.log(e.message);
  console.log(e);
}

export default compiler;