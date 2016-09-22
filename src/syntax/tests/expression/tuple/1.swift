func getAHighScore() -> (name: String, score: Int) {
  let theName = 1337
  let theScore = 3894
  
  return (theName, theScore)
}

let a = getAHighScore();

expect(a.0 == 1337);
expect(a.1 == 3894);