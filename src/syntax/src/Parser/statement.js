import {
  Token,
  Types as Type,
  TokenList as TT
} from "../labels";

import Node from "../nodes";

import {
  getNameByLabel
} from "../utils";

/**
 * @return {Node}
 */
export function parseStatement() {

  let node = null;

  switch (this.current.name) {
    /** Comment */
    case Token.BlockComment:
    case Token.LineComment:
      node = this.parseComment();
    break;
    /** Loop statement */
    case TT.FOR:
    case TT.WHILE:
    case TT.BREAK:
    case TT.CONTINUE:
      node = this.parseLoopStatement();
    break;
    /** Branch statement */
    case TT.IF:
    case TT.SWITCH:
    case TT.GET:
    case TT.SET:
      node = this.parseBranchStatement();
    break;
    /** Return statement */
    case TT.RETURN:
      node = this.parseReturnStatement();
    break;
    /** Declaration statement */
    case TT.LET:
    case TT.CONST:
    case TT.IMPORT:
    case TT.CLASS:
    case TT.FUNCTION:
    case TT.ENUM:
    case TT.EXTENSION:
    case TT.OPERATOR:
    case TT.POSTFIX:
    case TT.PREFIX:
    case TT.INFIX:
    case TT.CONSTRUCTOR:
      node = this.parseDeclarationStatement();
    break;
    /** Access control */
    case TT.PUBLIC:
    case TT.PRIVATE:
    case TT.INTERNAL:
      node = this.parseAccessControl();
    break;
    /** Final */
    case TT.FINAL:
      node = this.parseFinal();
    break;
    case TT.STATIC:
      node = this.parseStatic();
    break;
    /** Override */
    case TT.OVERRIDE:
      node = this.parseOverride();
    break;
    /** Operator things */
    case TT.ASSOCIATIVITY:
      node = this.parseAssociativityExpression();
    break;
    case TT.PRECEDENCE:
      node = this.parsePrecedenceExpression();
    break;
    /** Expression statement */
    default:
      node = this.parseAtom(this.parseExpressionStatement());
    break;
  };

  this.eat(TT.SEMICOLON);

  return (node);

}

/**
 * @return {Node}
 */
export function parseReturnStatement() {

  let node = this.createNode(Type.ReturnStatement);

  this.expect(TT.RETURN);

  node.argument = this.parseExpressionStatement();

  return (node);

}

/**
 * @return {Node}
 */
export function parseCondition() {

  let node = null;

  this.inCondition = true;
  this.eat(TT.LPAREN);
  node = this.parseStatement();
  this.eat(TT.RPAREN);
  this.inCondition = false;

  return (node);

}