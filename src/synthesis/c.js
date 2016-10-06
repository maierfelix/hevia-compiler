import { TT, Type, Token, Operator } from "../token";

/**
 * @param {Node} node
 */
export function emitProgram(node) {
	this.expectNodeKind(node, Type.Program);
	this.emitBlock(node.body);
}

/**
 * @param {Node} node
 */
export function emitBlock(node) {
	this.expectNodeKind(node, Type.BlockStatement);
  let ii = 0;
  let length = node.body.length;
  let statement = null;
  this.write("{\n");
  this.indent();
  for (; ii < length; ++ii) {
    statement = node.body[ii];
    this.writeIndent();
    this.emitStatement(statement);
    this.write(";");
    if (ii + 1 < length) this.write("\n");
  };
  this.write("\n");
  this.outdent();
  this.writeIndent();
	this.write("}");
}

/**
 * @param {Array} args
 */
export function emitArguments(args) {
	let ii = 0;
	let length = args.length;
	let arg = null;
	this.write("(");
	for (; ii < length; ++ii) {
		arg = args[ii];
		if (ii + 1 < length) this.write(", ");
		let type = arg.type.value.toLowerCase();
		this.write(type);
		this.write(" ");
		this.write(arg.name.value);
	};
	this.write(")");
}

/**
 * @param {Node} node
 */
export function emitStatement(node) {
	switch (node.kind) {
		case Type.VariableDeclaration:
			this.write(node.declaration.type.value.toLowerCase());
			this.write(" ");
			this.write(node.declaration.name.value);
			this.write(" = ");
			this.emitStatement(node.init);
		break;
		case Type.FunctionDeclaration:
			let type = node.type.value.toLowerCase();
			this.write(type);
			this.write(" ");
			this.write(node.name);
			this.emitArguments(node.arguments);
			this.emitBlock(node.body);
		break;
		case Type.ClassDeclaration:
			let name = node.name;
			this.write(`typedef struct ${name} `);
			this.insideClassBody = true;
			this.emitBlock(node.body);
			this.insideClassBody = false;
			this.emitStatement(node.ctor);
			this.write(` ${name}`);
		break;
		case Type.ReturnStatement:
			this.write("return ");
			this.write("(");
			this.emitStatement(node.argument);
			this.write(")");
		break;
		case Type.CallExpression:
			this.write(node.callee.value);
		break;
		case Type.BinaryExpression:
			let op = this.getOperatorAsString(node.operator);
      let isParenthised = node.isParenthised;
      if (isParenthised) this.write("(");
      if (this.isNativeOperator(node)) {
        this.emitStatement(node.left);
        this.write(` ${op} `);
        this.emitStatement(node.right);
      } else {
        this.write(`__OP__${op}`);
        this.write("(");
        this.emitStatement(node.left);
        this.write(", ");
        this.emitStatement(node.right);
        this.write(")");
      }
      if (isParenthised) this.write(")");
		break;
		case Type.Literal:
			let value = (
        this.isThisNode(node) ? "this" :
        node.type === Token.BooleanLiteral ? TT[node.value].toLowerCase() :
        node.type === Token.NullLiteral ? "null" :
        node.value
      );
			this.write(value);
		break;
		case Type.MemberExpression:
			this.emitStatement(node.object);
			this.write("->");
			this.emitStatement(node.property);
		break;
		case Type.ConstructorDeclaration:
			if (this.insideClassBody) return void 0;
		break;
		default:
			this.throw(`Unknown node of kind '${this.getNodeKindAsString(node)}'`);
		break;
	}
	return void 0;
}