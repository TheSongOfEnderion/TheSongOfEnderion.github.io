const autoLinkExclude = [
  "spoiler",
  "spoiler/",
  "toc"
]

const autoLinkBtn = (name, id, path) => {
  return path.includes("404") ?
   `<button class="button button--error" onclick="changePage('${name}', '${id}', '${path}')">${name}</button>` :
   `<button class="button button--autolink" onclick="changePage('${name}', '${id}', '${path}')">${name}</button>`
}


function autoLink(value, directory) { 
  const regex = /\[\[(.*?)\]\]/g;
  const matches = [];
  let match;
  
  while ((match = regex.exec(value)) !== null) {
    if (autoLinkExclude.includes(match[1])) continue;
    if (match[1].includes("|")) {
      let [name_real, name_fale] = match[1].split("|")
      matches.push([name_real.trim(), name_fale.trim(), match[1].trim()])
      continue
    }
    matches.push([match[1].trim()]);
  }

  // First check
  for (let index = matches.length - 1; index >= 0; index--) { 
    const item = matches[index]
    const name_real = item[0]
    let name_low;

    if (item.length != 3) {
      name_low = name_real.toLowerCase()
    } else {
      name_low = item[0].toLowerCase()
    }

    if (directory.hasOwnProperty(name_low)) {
      const title = directory[name_low].title
      const path = directory[name_low].path
      
      
      // Has a fake name
      if (item.length == 3) {
        value = value.replace(`[[${item[2]}]]`, autoLinkBtn(item[1], item[0], path))
      } else {
        value = value.replace(`[[${name_real}]]`, autoLinkBtn(title, name_real, path))
      }

      matches.splice(index, 1);
    }
  }

  
  // Second Check
  for (const entry in directory) {
    const title = directory[entry].title
    const loweredTitle = title.toLowerCase()


    for (let index = matches.length - 1; index >= 0; index--) { 
      const item = matches[index]

      if (loweredTitle == item[0].toLowerCase()) {
        const path = directory[entry].path
        
        if (item.length == 3) {
          console.log(item)
          value = value.replace(`[[${item[2]}]]`, autoLinkBtn(item[1], entry, path))
        } else {
          value = value.replace(`[[${item[0]}]]`, autoLinkBtn(title, entry, path))
        }
        
        matches.splice(index, 1);
      }
    }
  }


  matches.map((item, index, array)=>{
    item.length == 3 ? 
    value = value.replace(`[[${item[2]}]]`, autoLinkBtn(item[1], item[0], "assets/404.md")) :
    value = value.replace(`[[${item[0]}]]`, autoLinkBtn(item[0], item[0], "assets/404.md"))    
  })
  
  return value
}