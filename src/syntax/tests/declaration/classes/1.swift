class A { }
class B { }
class Human {
  var gender:Int
  constructor(gender:Int) {
    self.gender = 1;
  }
  func numeric(a:Int) -> Int {
    return (a * 2);
  }
}

var a = Human(gender: 0);