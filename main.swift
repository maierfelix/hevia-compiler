func swap(c: inout Int, d: inout Int) {
  let temp:Int = c
  c = d
  d = temp
}

let a:Int = 1337
let b:Int = 1338

swap(c: &a, d: &b)

a