import fs from "fs";
import cmd from "commander";

import { VERSION } from "./cfg";

cmd
  .version(VERSION)
  .option("-i, --input [file]", "Input file")
  .parse(process.argv);

let input = {};

if (cmd.input) {
  let path = cmd.input;
  const file = fs.readFileSync(path, "utf8");
  input.input = file;
  input.path = path;
}

export default input;