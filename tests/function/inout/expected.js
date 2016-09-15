var swap = function(c, d) {
  const temp = c.iov;
  c.iov = d.iov;
  d.iov = temp;
};