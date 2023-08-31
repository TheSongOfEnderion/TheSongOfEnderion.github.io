const autoLinkExclude = [
  "spoiler",
  "spoiler/",
  "toc"
]

const autoLinkBtn = (title, pageId, isError=false) => {
  const btnClass = isError == true ? 'button--error' : 'button--autolink'
  return `<button class="button ${btnClass}" onclick="changePage('${pageId}')">${title}</button>`
}


function autoLink(value, directory) { 
  const regex = /\[\[(.*?)\]\]/g;
  const matches = [];
  let match;
  
  // Creates matches object to iterate through
  while ((match = regex.exec(value)) !== null) {
    // if unallowed box
    if (autoLinkExclude.includes(match[1])) continue;

    // If using the format [[name | custom_name]]
    if (match[1].includes("|")) {
      let [title, name_toshow] = match[1].split("|")
      matches.push({
          title: title.trim(),
          pageId: title.trim().toLowerCase().replace(" ", "-"),
          name_toshow: name_toshow.trim(),
          original_string: match[1].trim(),
          is_custom: true,
        })
      continue
    }
    // If normal [[name]]
    matches.push({
      title: match[1].trim(),
      pageId: match[1].trim().toLowerCase().replace(" ", "-"),
      original_string: match[1].trim(),
      is_custom: false,
    });
  }

  // First check
  for (let index =  matches.length-1; index >= 0; index--) { 
    const item = matches[index]

    // Check if it does nnot exist
    if (!directory.hasOwnProperty(item.pageId)) continue

    const title = directory[item.pageId].title
    const path = directory[item.pageId].path
    
    value = value.replace(`[[${item.original_string}]]`, 
                           autoLinkBtn(item.is_custom == true? item.name_toshow : title, 
                                       item.pageId,
                                       ))

    // Remove finished entry from matches
    matches.splice(index, 1)

  }

  // Add error buttons
  matches.map((item, index, array)=>{
    value = value.replace(`[[${item.original_string}]]`, 
      autoLinkBtn(item.is_custom == true? item.name_toshow : item.title, item.pageId, true))
  }) 

  return value
}


  
  // Second Check
  // for (const entry in directory) { 
  //   const title = directory[entry].title
  //   const pageId = title.toLowerCase()


  //   for (const index=matches.length-1; index>=0; index--) { 
  //     const item = matches[index]

  //     if (pageId == item.pageId) {
  //       const path = directory[entry].path
        
  //       if (item.length == 3) {
  //         console.log(item)
  //         value = value.replace(`[[${item[2]}]]`, autoLinkBtn(item[1], entry, path))
  //       } else {
  //         value = value.replace(`[[${item[0]}]]`, autoLinkBtn(title, entry, path))
  //       }
        
  //       matches.splice(index, 1);
  //     }
  //   }
  // }


