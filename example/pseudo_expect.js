var String = (function() {
  function String() {
    this._length = 0;
  }
  Object.defineProperty(String.prototype, "length", {
    get: function() {
      return this._length;
    },
    set: function(n) {
      this._length = n;
    },
    enumerable: true,
    configurable: true
  });
  return String;
}());