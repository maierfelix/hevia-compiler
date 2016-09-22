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
export function parseClass() {

  let node = this.createNode(Type.ClassDeclaration);

  this.expect(TT.CLASS);

  if (this.peek(Token.Identifier)) {
    node.name = this.extract(Token.Identifier).value;
  }

  this.expect(TT.LBRACE);
  node.body = this.parseBlock();
  this.expect(TT.RBRACE);

  return (node);

}