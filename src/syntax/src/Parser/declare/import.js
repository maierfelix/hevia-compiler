import {
  Token,
  Types as Type,
  TokenList as TT
} from "../../labels";

import Node from "../../nodes";

/**
 * @return {Node}
 */
export function parseImport() {

  let node = this.createNode(Type.ImportDeclaration);

  this.expect(TT.IMPORT);

  let key = null;
  while (true) {
  	key = this.parseExpressionStatement();
  	if (key.kind !== Type.Literal) break;
  	node.specifiers.push(key);
  	if (!this.eat(TT.COMMA)) break;
  };

  return (node);

}