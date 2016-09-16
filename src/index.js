import fs from "fs";
import vm from "vm";
import hevia from "hevia";
import Scope from "./scope";

import { VERSION } from "./cfg";
import { greet, inherit } from "./utils";
import { TT, Type, Token, Operator } from "./token";

import * as _walk from "./walk";

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
   * @param {String} name
   * @return {Node}
   */
  resolveIdentifier(name) {
    let resolve = this.scope.resolve(name);
    if (resolve === null) this.throw(`${name} is not defined!`);
    return (resolve || null);
  }

  /**
   * @param {Node} node
   * @param {Number} kind
   */
  expectNodeKind(node, kind) {
    if (!this.isNodeKindOf(node, kind)) {
      let nodeKind = this.getNodeTypeAsString(node);
      let expKind = Type[kind];
      let msg = `Invalid node kind! Expected ${expKind} but got ${nodeKind}`;
      this.throw(msg);
    }
  }

  /**
   * @param {Node} node
   * @param {String} property
   */
  expectNodeProperty(node, property) {
    if (!node.hasOwnProperty(property)) {
      let msg = `${this.getNodeTypeAsString(node)} doesn't have property ${property}`;
      this.throw(msg);
    }
  }

  /**
   * @param {String} msg
   */
  walk(str) {
    let ast = this.parse(str);
    this.walkSimple(ast);
    this.compiled = true;
    this.walkSimple(ast);
    console.log("----------------");
    let result = vm.runInNewContext(this.content, {});
    console.log(this.content);
    console.log("=>", result);
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

}

inherit(Compiler, _walk);

const compiler = new Compiler();

compiler.walk(cmd.input);

export default compiler;