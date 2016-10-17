import {
  Token,
  Types as Type,
  TokenList as TT,
  Operators as OP
} from "../../labels";

import Node from "../../nodes";

import {
  isLiteral,
  getNameByLabel
} from "../../utils";

/**
 * @return {Node}
 */
export function parseLiteral() {

  let node = this.createNode(Type.Literal);

  // Enum access
  if (this.peek(TT.PERIOD)) {
    node = this.parseAtom();
    node.object = null;
    return (node);
  }

  // Unary pex expression
  if (this.isPrefixOperator(this.current)) {
    return this.parseUnaryExpression(null);
  }

  // Call expression
  if (this.eat(TT.LPAREN)) {
    // Empty
    if (this.eat(TT.RPAREN)) {
      return (null);
    }
    let tmp = this.parseStatement();
    // Got a tuple
    if (this.eat(TT.COMMA)) {
      // Parse all folowing tuple parameters
      let args = this.parseCommaSeperatedValues();
      args.unshift(tmp);
      tmp = args;
    }
    this.expect(TT.RPAREN);
    return (tmp);
  }

  let isExplicit = this.eat(TT.UL);

  // Literal passed as pointer
  if (this.eat(TT.BIT_AND)) {
    node.isPointer = true;
  }

  if (isExplicit && this.peek(TT.COLON) && !this.inTernary) {
    // Explicit only parameter
  } else {
    // Parse literal
    if (isLiteral(this.current.name)) {
      node.type = this.current.name;
      node.value = this.current.value;
      node.raw = this.current.value;
      this.next();
    }
    // No literal to parse
    else {
      node = this.parseStatement();
    }
    if (TT[node.type] !== void 0) {
      node.value = node.raw = String(node.type);
      if (TT[node.value] === "NULL") {
        node.type = Token.NullLiteral;
      }
      else {
        node.type = Token.BooleanLiteral;
      }
    }
  }

  // Dont parse colon as argument, if in ternary expression
  if (!this.inTernary && this.peek(TT.COLON)) {
    node = this.parseType(node);
    if (isExplicit) {
      node.isExplicit = true;
    }
  }

  this.parseChaining(node);

  return (node);

}

/**
 * Parse a literal head,
 * supports functions names
 * which are operators
 * @return {String}
 */
export function parseLiteralHead() {

  let str = TT[this.current.name];

  // Custom operator
  if (str) {
    this.next();
    return (str);
  }

  // Default literal
  return (this.extract(Token.Identifier).value);

}

/**
 * Parse as literal, don't
 * care what it really is
 * @return {Node}
 */
export function parseSpecialLiteral() {

  let node = this.createNode(Type.Literal);

  node.type = this.current.name;
  node.value = this.current.value;
  node.raw = this.current.value;
  this.next();

  return (node);

}