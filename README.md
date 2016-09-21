# Hevia Compiler
Swift-like strongly typed language that compiles to C and JavaScript

# Syntax
````swift
func swap(c: inout Int, d: inout Int) {
  const tmp:Int = c
  c = d
  d = tmp
}
 
let a:Int = 1337
let b:Int = 1338
 
swap(a, b)
 
const e:Int = 42
 
class Vector {
  let x:Int = 0
  let y:Int = 0
  constructor(x: Int, y:Int) {
    this.x = x
    this.y = y
  }
}
 
infix operator equals {
  associativity left
  precedence 160
  constructor(left:Vector, right:Vector) -> Boolean {
    return (
      left.x == right.x &&
      left.y == right.y
    );
  }
}
 
let vecA:Vector = Vector(a, 2)
let vecB:Vector = Vector(b, 5 * 7)
let vecC:Boolean = vecA equals vecB
let vecD:Boolean = vecA equals vecB
````
