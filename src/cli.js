import fs from "fs";
import cmd from "commander";

import { VERSION } from "./cfg";

cmd
  .version(VERSION)
  .option("-i, --input [file]", "Input file")
  .parse(process.argv);

let input = {};

if (cmd.input) {
  const file = fs.readFileSync(cmd.input, "utf8");
  input.input = file;
}

export default input;