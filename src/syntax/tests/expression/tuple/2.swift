var someScore = (11, 55)

var anotherScore = someScore
anotherScore.0 = 22

expect(anotherScore.1 === 55);
expect(anotherScore.0 === 22);
expect(someScore.0 === 11);