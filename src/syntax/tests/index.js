var fs = require("fs");
var diff = require("deep-diff").diff;
var hevia = require("../dist/hevia.js");

var dir = __dirname + "/";
var ignore = ["unreached", "index.js"];
var sources = [];

var tolerate = ["operator", "kind", "symbol", "type", "name"];

function readFile(entry) {
  if (/\.swift$/.test(entry)) {
    var src = {
      name: entry,
      src: fs.readFileSync(entry, "utf8"),
      json: fs.readFileSync(entry.replace("swift", "json"), "utf8")
    };
    sources.push(src);
  }
}

function readDir(dir) {
  fs.readdirSync(dir).forEach(function(entry) {
    if (ignore.indexOf(entry) > -1) return void 0;
    var file = dir + '/' + entry;
    var stat = fs.statSync(file);
    if (stat.isDirectory()) {
      readDir(file);
    } else {
      readFile(file);
    }
  });
}

readDir(dir);

var failures = 0;

var FAILED = "\x1b[31;1mFAILED\x1b[0m";
var PASSED = "\x1b[32;1mPASSED\x1b[0m";

sources.map((src) => {
  var tokens = null;
  var ast = null;
  var code = null;
  var success = false;
  var error = null;
  var name = src.name.replace(dir, "").slice(1, src.name.length);
  try {
    tokens = hevia.tokenize(src.src);
    ast = hevia.parse(tokens);
    var differences = diff(
      JSON.parse(JSON.stringify(ast)),
      JSON.parse(src.json)
    );
    if (differences !== void 0 && differences.length) {
      differences.map((dif) => {
        // op registers are cumulative, so ignore
        let failed = dif.path[dif.path.length - 1];
        if (tolerate.indexOf(failed) === -1) {
          throw new Error(`${failed} doesnt match!`);
        }
        else success = true;
      });
    }
    else success = true;
  } catch(e) {
    error = e;
    success = false;
  }
  if (!success) {
    failures++;
  }
  // super duper dirty
  console.log(`[${success ? PASSED : FAILED}]::${name + (!success ? " => " + error : "")}`);
});

if (failures) {
  console.log(`\n${failures} ${failures === 1 ? "FAILURE" : "FAILURES"}!`);
} else {
  console.log("\nSTABLE!");
}