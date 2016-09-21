var swap = function(c, d) {
  const tmp = c.$iov;
  c.$iov = d.$iov;
  d.$iov = tmp;
};

var a = { $iov: 1337 };
var b = { $iov: 1338 };

swap(a, b);