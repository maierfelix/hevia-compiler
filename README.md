<h1 align="center">Hevia Compiler</h1>

<div align="center">
  <strong>Swift-like strongly typed language that compiles to JavaScript.</strong>
</div>

<br/>

<div align="center">
  <a href="#">
    <img src="https://img.shields.io/badge/Target-JS-f1e05a.svg?style=flat-square" alt="Target JS" />
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

# Features
 - Custom operators
 - Type inference
 - Enums
 - Inout (pass by reference)
 - Classes

# Todo:
 - Arrays
 - Structs
 - Bootstrapping
 - Operator overloading
 - Optimizations (Tree shaking, variable folding..)
 - Restrict inout possibilities *ewww*

# Examples
## Swap two variables with a custom operator
````swift
let a = 7
let b = 42

infix operator swap {
  associativity left
  precedence 120
  constructor(lhs: inout Int, rhs:Int) {
    const tmp = lhs
    lhs = rhs
    rhs = tmp
  }
}

a swap b;
````
## Compare two vectors
````swift
class Vector {
  let x = 0
  let y = 0
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

let vecA = Vector(2, 2)
let vecB = Vector(4, 4)

vecA equals vecB // false
````
## Fibonacci
````swift
func fibonacci(n:Int) {
  if n == 0 || n == 1 {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}
````
