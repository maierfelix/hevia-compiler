<h1 align="center">Hevia Compiler</h1>

<div align="center">
  <strong>Swift-like strongly typed language that compiles to C and JavaScript.</strong>
</div>

<br/>

<div align="center">
  <a href="#">
    <img src="https://img.shields.io/badge/Target-JS-f1e05a.svg?style=flat-square" alt="Target JS" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Target-C-353535.svg?style=flat-square" alt="Target C" />
  </a>
  <br/>
  <a href="https://travis-ci.org/maierfelix/hevia-compiler">
    <img src="https://img.shields.io/travis/maierfelix/hevia-compiler/master.svg?style=flat-square" alt="Build Status" />
  </a>
  <a href="https://github.com/maierfelix/hevia-compiler/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/MIT-License-blue.svg?style=flat-square" alt="License" />
  </a>
  <a href="https://www.npmjs.com/package/hevia">
    <img src="https://img.shields.io/npm/v/hevia-compiler.svg?style=flat-square" alt="NPM Version" />
  </a>
  <a href="https://nodejs.org/api/documentation.html#documentation_stability_index">
    <img src="https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square" alt="Stability" />
  </a>
</div>

# What is it?
Hevia is a strongly-typed programming language for building cross-platform software. It compiles to straightforward, optimized, readable JavaScript and C source code. Hevia offers features like defining custom operators, inout parameters, enums and a clean, semicolon-less syntax.

Garbage collection is not implemented yet.

# Examples
## Swap two variables with a custom operator
````swift
let a:Int = 7
let b:Int = 42

infix operator swap {
  associativity left
  precedence 120
  constructor(lhs: inout Int, rhs:Int) {
    const tmp:Int = lhs
    lhs = rhs
    rhs = tmp
  }
}

a swap b;
````
## Compare two vectors
````swift
class Vector {
  let x:Int = 0
  let y:Int = 0
  constructor(x:Int, y:Int) {
    this.x = x
    this.y = y
  }
}

infix operator equals {
  associativity left
  precedence 90
  constructor(left:Vector, right:Vector)->Boolean {
    return (
      left.x == right.x &&
      left.y == right.y
    )
  }
}

let vecA:Vector = Vector(2, 2)
let vecB:Vector = Vector(4, 4)

vecA equals vecB // false
````
