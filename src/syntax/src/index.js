import Parser from "./Parser";
import Tokenizer from "./Tokenizer";

import "./build";

import Node from "./nodes";

import * as labels from "./labels";

const parse = (tokens) => {
  let parser = new Parser();
  return (parser.parse(tokens));
};

const tokenize = (code, opts) => {
  let tokenizer = new Tokenizer();
  return (tokenizer.scan(code, opts));
};

const parseFakeLiteral = (type) => {
  return (
    new Parser().parseFakeLiteral(type)
  );
};

module.exports = {
  parse,
  parseFakeLiteral,
  tokenize,
  labels,
  Node
}

if (typeof window !== "undefined") {
  window.hevia = module.exports;
}