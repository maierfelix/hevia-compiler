import { TT, Type, Token, Operator } from "../token";

/**
 * @param {Node} node
 */
export function ozProgram(node) {
	this.expectNodeKind(node, Type.Program);
	this.ozBlock(node.body);
};

/**
 * @param {Node} node
 */
export function ozBlock(node) {
	this.expectNodeKind(node, Type.BlockStatement);
	let ii = 0;
	let length = node.body.length;
	for (; ii < length; ++ii) {
		this.ozStatement(node.body[ii]);
	};
}

/**
 * @param {Node} node
 */
export function ozStatement(node) {
	switch (node.kind) {
		case Type.BinaryExpression:
			if (this.isPureLiteralExpression(node)) {
				if (this.isNativeOperator(node)) {
					console.log(node.left.value, this.getOperatorByKind(node), node.right.value);
				}
			}
		break;
	};
}

export function isPureLiteralExpression(node) {
	return (
		node.left.kind === Type.Literal &&
		node.right.kind === Type.Literal &&
		node.left.type === Token.Identifier &&
		node.right.type === Token.Identifier
	);
}