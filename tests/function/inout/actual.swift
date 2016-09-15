func swap(c: inout Int, d: inout Int) {
  let temp:Int = c;
  c = d;
  d = temp;
}