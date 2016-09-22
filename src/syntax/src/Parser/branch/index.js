import {
  Token,
  Types as Type,
  TokenList as TT
} from "../../labels";

import Node from "../../nodes";

/**
 * @return {Node}
 */
export function parseBranchStatement() {

  switch (this.current.name) {
    case TT.IF:
      return this.parseIfStatement();
    break;
    case TT.SWITCH:
      return this.parseSwitch;
    break;
    case TT.GET:
    case TT.SET:
      return this.parsePseudoProperty();
    break;
  };

  return (null);

}