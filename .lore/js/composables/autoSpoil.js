

function autoSpoil(value) {

  const spoilers = value.match(/\[\[spoiler\]\]([\S\s]*?)\[\[\/spoiler\]\]/gm)

  for (let index in spoilers) {
    const spoiler = spoilers[index]

    // console.log(spoiler)

    value = value.replace(spoiler, 
      "<span class=\"spoilers\">" + 
      spoiler
        .replace("[[spoiler]]", "")
        .replace("[[/spoiler]]", "")
        .trim() 
        + "</span>")
    // console.log(value)
  }
  

  return value
}
