var globalIdList = []

function makeid(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let randomWord = '';

  while (true) {
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomWord += characters[randomIndex];
    }
    if (globalIdList.includes(randomWord)) {
      randomWord = '';
      continue
    }
    break;
  }

  return randomWord;
}