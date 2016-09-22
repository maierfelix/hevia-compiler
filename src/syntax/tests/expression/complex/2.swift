prefix operator √ {}
prefix func √ (number: Double) -> Double {
  return sqrt(number)
}

expect(5-- + !(√4==2));