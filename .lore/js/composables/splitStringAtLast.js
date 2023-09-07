function splitStringAtLast(inputString, delimiter) {
  const lastIndex = inputString.lastIndexOf(delimiter);
  return lastIndex === -1 ? [inputString] : [inputString.slice(0, lastIndex), inputString.slice(lastIndex + delimiter.length)];
}
