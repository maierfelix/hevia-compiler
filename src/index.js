import fs from "fs";
import hevia from "hevia";

import { VERSION } from "./cfg";
import { greet, inherit } from "./utils";
import { TT, Type, Token } from "./token";

import * as _walk from "./walk";
import * as _variable from "./emit/variable";
import * as _function from "./emit/function";
import * as _arguments from "./emit/arguments";

/**
 * @class Compiler
 */
class Compiler {

  /** @constructor */
  constructor() {

    this.padding = 0;
    this.spacing = 2;

    this.blocks = [];
    this.content = "";

  }

  /**
   * @param {String} msg
   */
  write(str) {
    this.content += str;
  }

  indent() {
    this.padding += this.spacing;
  }

  outdent() {
    this.padding -= this.spacing;
  }

  /**
   * @param {String} msg
   */
  expect(msg) {
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
   * @param {Number} kind
   */
  expectNodeKind(node, kind) {
    if (!this.isNodeKindOf(node, kind)) {
      let nodeKind = this.getNodeTypeAsString(node);
      let expKind = Type[kind];
      let msg = `Invalid node kind! Expected ${expKind} but got ${nodeKind}`;
      this.expect(msg);
    }
  }

  /**
   * @param {Node} node
   * @param {String} property
   */
  expectNodeProperty(node, property) {
    if (!node.hasOwnProperty(property)) {
      let msg = `${this.getNodeTypeAsString(node)} doesn't have property ${property}`;
      this.expect(msg);
    }
  }

  /**
   * @param {String} msg
   */
  transform(str) {
    let ast = this.parse(str);
    this.walk(ast);
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
inherit(Compiler, _variable);
inherit(Compiler, _function);
inherit(Compiler, _arguments);

(() => {
  const file = fs.readFileSync(process.argv[2], "utf8");
  const compiler = new Compiler();
  compiler.transform(file);
})();