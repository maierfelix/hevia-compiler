import {
  Token,
  Types as Type,
  TokenList as TT,
  Operators as OP
} from "../../labels";

import Node from "../../nodes";

import {
  getNameByLabel
} from "../../utils";

/**
 * @return {Node}
 */
export function parseEnum() {

  let key = null;
  let node = this.createNode(Type.EnumDeclaration);

  this.expect(TT.ENUM);

  if (this.peek(Token.Identifier)) {
    node.name = this.parseLiteral();
  }

  this.expect(TT.LBRACE);
  while (true) {
    key = this.parseExpressionStatement();
    if (key === null) break;
    if (key.kind !== Type.Literal && key.kind !== Type.BinaryExpression) {
      throw new Error(`Expected 'Literal' or 'BinaryExpression' but got '${getNameByLabel(key.kind)}'`);
    }
    if (key.kind === Type.BinaryExpression) {
      if (key.operator !== TT.ASSIGN) {
        throw new Error(`Only '=' operator is allowed here but got '${OP[TT[key.operator]].op}'`);
      }
    }
    /*if (key.kind !== Type.Literal) {
      throw new Error(`Expected 'Literal' but got '${getNameByLabel(key.kind)}'`);
    }*/
    node.keys.push(key);
    if (!this.eat(TT.COMMA)) break;
  };
  this.expect(TT.RBRACE);

  return (node);

}