import { TT, Type, Token, Operator } from "../token";

/**
 * @param {Node} node
 * @param {Node} parent
 */
export function emitProgram(node) {
  this.expectNodeKind(node, Type.Program);
  for (let key of node.body.body) {
    this.emitStatement(key);
  };
}

export function emitBlock(node) {
  this.expectNodeKind(node, Type.BlockStatement);
  this.write("{\n");
  for (let key of node.body) {
    this.emitStatement(key);
  };
  this.write("}\n");
}

export function emitStatement(node) {
  switch (node.kind) {
    case Type.FunctionDeclaration:
      this.write("var ");
      this.write(node.name);
      this.write(" = ");
      this.write("function ");
      this.write("(");
      this.emitArguments(node.arguments);
      this.write(") ");
      this.emitBlock(node.body);
    break;
    case Type.ClassDeclaration:
      this.insideClass = true;
      // class
      this.write("class ");
      this.write(node.name);
      this.write(" {\n");
      // constructor
      this.write("constructor ");
      this.write("(");
      this.emitArguments(node.ctor.arguments);
      this.write(")");
      this.write(" {\n");
      // fake constructor body
      for (let key of node.body.body) {
        if (key.kind !== Type.ConstructorDeclaration) {
          this.emitStatement(key);
        }
      };
      // __init
      this.write("this.__init");
      this.write("(");
      this.emitArguments(node.ctor.arguments);
      this.write(");\n");
      this.write("}\n");
      this.insideClass = false;
      // real constructor body
      this.emitStatement(node.ctor);
      this.write(" }\n");
    break;
    case Type.ConstructorDeclaration:
      this.write("__init");
      this.write("(");
      this.emitArguments(node.arguments);
      this.write(") ");
      this.emitBlock(node.body);
    break;
    case Type.VariableDeclaration:
      if (this.insideClass) {
        this.write("this.");
      }
      else if (node.isConstant) this.write("const ");
      else this.write("var ");
      this.write(node.declaration.name.value);
      this.write(" = ");
      if (node.declaration.isPointer) {
        this.write("{ $iov: ");
        this.emitStatement(node.init);
        this.write(" }");
      } else {
        this.emitStatement(node.init);
      }
      this.write(";\n");
    break;
    case Type.BinaryExpression:
      this.emitStatement(node.left);
      let op = this.getOperatorByKind(node.operator);
      this.write(` ${op.operator || op.op} `);
      this.emitStatement(node.right);
      this.write(";\n");
    break;
    case Type.TernaryExpression:
      this.emitStatement(node.test);
      this.write(" ? ");
      this.emitStatement(node.consequent);
      this.write(" : ");
      this.emitStatement(node.alternate);
    break;
    case Type.MemberExpression:
      this.emitStatement(node.object);
      this.write(".");
      this.emitStatement(node.property);
    break;
    case Type.CallExpression:
      if (node.isClassCreation) {
        this.write("new ");
      }
      this.write(node.callee.value);
      this.write("(");
      this.emitArguments(node.arguments);
      this.write(")");
    break;
    case Type.IfStatement:
      if (node.test !== null) {
        if (node.parent.kind === Type.IfStatement) {
          this.write("else ");
        }
        this.write("if (");
        this.emitStatement(node.test);
        this.write(") ");
      } else {
        this.write("else ");
      }
      this.emitBlock(node.consequent);
      if (node.alternate !== null) {
        this.emitStatement(node.alternate);
      }
    break;
    case Type.Literal:
      let value = (
        this.isThisNode(node) ? "this" : node.value
      );
      if (node.isReference) {
        this.write(`${value}.$iov`);
      } else {
        this.write(value);
      }
    break;
    case Type.TypeExpression:
      this.write(node.name.value);
    break;
    default:
      this.throw(`Unhandled node kind '${this.getNodeKindAsString(node)}'`);
    break;
  };
}

export function emitArguments(args) {
  let ii = 0;
  let length = args.length;
  for (; ii < length; ++ii) {
    this.emitStatement(args[ii]);
    if (ii + 1 < length) this.write(", ");
  };
}

export function emitExpression(node) {
  console.log(node);
}