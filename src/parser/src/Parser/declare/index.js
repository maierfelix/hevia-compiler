import {
  Token,
  Types as Type,
  TokenList as TT
} from "../../labels";

import Node from "../../nodes";

import {
  getNameByLabel
} from "../../utils";

import {
  FUNC_DEFAULT_TYPE
} from "../../const";

/**
 * @return {Node}
 */
export function parseDeclarationStatement() {

  let node = null;

  switch (this.current.name) {
    case TT.IMPORT:
      node = this.parseImport();
    break;
    case TT.VAR:
    case TT.LET:
    case TT.CONST:
      node = this.parseVariableDeclaration();
    break;
    case TT.CLASS:
      node = this.parseClass();
    break;
    case TT.FUNCTION:
      node = this.parseFunction();
    break;
    case TT.ENUM:
      node = this.parseEnum();
    break;
    case TT.CONSTRUCTOR:
      node = this.parseConstructor();
    break;
    case TT.EXTENSION:
      node = this.parseExtension();
    break;
    case TT.INFIX:
    case TT.POSTFIX:
    case TT.PREFIX:
      node = this.parseOperator();
    break;
  };

  this.eat(TT.SEMICOLON);

  return (node);

}

/**
 * @return {Node}
 */
export function parseConstructor() {

  let node = this.createNode(Type.ConstructorDeclaration);

  this.expect(TT.CONSTRUCTOR);

  node.arguments = this.parseArguments();

  if (this.peek(TT.ARROW)) {
    node.type = this.parseType().type;
  } else {
    node.type = this.parseFakeLiteral(FUNC_DEFAULT_TYPE);
  }

  if (this.eat(TT.LBRACE)) {
    node.body = this.parseBlock();
    this.expect(TT.RBRACE);
  }

  return (node);

}