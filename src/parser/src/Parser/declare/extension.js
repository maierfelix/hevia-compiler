import {
  Token,
  Types as Type,
  TokenList as TT
} from "../../labels";

import Node from "../../nodes";

/**
 * @return {Node}
 */
export function parseExtension() {

  let node = this.createNode(Type.ExtensionDeclaration);

  this.expect(TT.EXTENSION);

  node.argument = this.parseLiteralHead();

  this.expect(TT.LBRACE);
  node.body = this.parseBlock();
  this.expect(TT.RBRACE);

  return (node);

}