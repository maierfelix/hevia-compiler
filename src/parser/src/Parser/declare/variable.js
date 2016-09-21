import {
  Token,
  Types as Type,
  TokenList as TT
} from "../../labels";

import Node from "../../nodes";

import {
  getNameByLabel
} from "../../utils";

/**
 * @return {Node}
 */
export function parseVariableDeclaration() {

  let declaration = null;
  let node = this.createNode(Type.VariableDeclaration);

  if (
    this.peek(TT.VAR) ||
    this.peek(TT.LET) ||
    this.peek(TT.CONST)
  ) {
    node.symbol = this.current.name;
    this.next();
  }

  this.parseVariable(node);

  return (node);

}

/**
 * @return {Node}
 */
export function parseVariable(node) {

  node.declaration = this.parseVariableDeclarement();

  if (this.eat(TT.ASSIGN)) {
    node.init = this.parseStatement();
  } else {
    node.init = this.parseFakeLiteral(TT.NULL);
  }

  node.name = node.declaration.name;

}

/**
 * @return {Array}
 */
export function parseVariableDeclarement() {

  let args = null;

  if (this.peek(Token.Identifier)) {
    args = this.parseLiteral();
  } else if (this.peek(TT.LPAREN)) {
    args = this.parseArguments();
  }

  return (args);

}