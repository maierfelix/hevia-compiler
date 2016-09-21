import {
  Token,
  Types as Type,
  TokenList as TT
} from "../../labels";

import Node from "../../nodes";

import {
  isLiteral,
  getNameByLabel
} from "../../utils";

/**
 * @return {Node}
 */
export function parseExpressionStatement() {

  let node = null;

  switch (this.current.name) {
    /** Array */
    case TT.LBRACK:
      node = this.parseAtom(this.parseArrayExpression());
    break;
    default:
      if (
        this.isOperator(this.current.name) ||
        isLiteral(this.current.name)
      ) {
        node = this.parseBinaryExpression(0);
      }
    break;
  };

  if (this.peek(TT.CONDITIONAL) && this.current.isTernary) {
    node = this.parseTernaryExpression(node);
  }

  return (node);

}