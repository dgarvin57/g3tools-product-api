exports.zeroFill = function (number, width) {
  width -= number.toString().length;
  if (width > 0) {
    return new Array(width + (/\./.test(number) ? 2 : 1)).join("0") + number;
  }
  return number + ""; // always return a string
};

exports.isEmpty = function (str) {
  return !str || 0 === str.length;
};

exports.isBlank = function (str) {
  return !str || /^\s*$/.test(str);
};
