import fs from "fs";
import vm from "vm";
import hevia from "./parser";
import Scope from "./compile/scope";

import { VERSION } from "./cfg";
import { greet, inherit } from "./utils";
import { TT, Type, Token, Operator } from "./token";

import * as _generate from "./generate";

import * as _compile from "./compile";
import * as _compile_walk from "./compile/walk";
import * as _compile_visit from "./compile/visit";
import * as _compile_resolve from "./compile/resolve";

import * as _semantic from "./semantic";
import * as _semantic_visit from "./semantic/visit";

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

    /**
     * Used to determine
     * double compilation
     * @type {Boolean}
     */
    this.compiled = false;

    this.visitors = {};

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
  getNodeTypeAsString(node) {
    return (Type[node.kind]);
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
   * @param {Number} kind
   */
  expectNodeKind(node, kind) {
    if (!this.isNodeKindOf(node, kind)) {
      let nodeKind = this.getNodeTypeAsString(node);
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
      let msg = `'${this.getNodeTypeAsString(node)}' doesn't have property '${property}'`;
      this.throw(msg);
    }
  }

  /**
   * @param {String} msg
   * @param {String} target
   */
  compile(str, target) {
    if (!target in _generate) {
      this.throw(`Target '${target}' is unsupported`);
    }
    let ast = this.parse(str);
    this.walk(ast);
    this.compiled = true;
    console.log("----------------");
    console.log(this.content);
    //console.log("=>", vm.runInNewContext(this.content, {}));
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
    let visitor = null;
    for (let key in this.visitors) {
      visitor = this.visitors[key];
      if (visitor[node.kind] !== void 0) {
        visitor[node.kind].apply(this, [node]);
      }
    };
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

inherit(Compiler, _compile);
inherit(Compiler, _semantic);
inherit(Compiler, _compile_walk);
inherit(Compiler, _compile_resolve);

const compiler = new Compiler();

compiler.registerVisitors(_compile_visit, "compile");
compiler.registerVisitors(_semantic_visit, "semantic");

try {
  compiler.compile(cmd.input, "js");
} catch (e) {
  //console.log(e.message);
  console.log(e);
}

export default compiler;