// An Autoimport script that does the following:
// - Auto imports all partial scss in component folders into "_import.scss"
//   to combine it with the global.scss
// - Auto import all components into the app
// - Compiles all components and app.js into a single index.js
// - Adds template on newly created component js

import fs from 'fs';
import path from 'path';


function findFilesInDirectory(directoryPath, extension) {
  const scssFiles = [];

  function searchForSCSSFiles(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        searchForSCSSFiles(filePath);
      } else if (path.extname(file) === extension) {
        scssFiles.push(filePath);
      }
    }
  }

  searchForSCSSFiles(directoryPath);
  return scssFiles;
}

function splitOnLast(str, substring) {
  const arr = str.split(substring)
  const last = arr.pop()
  const folderName = arr.pop()
  return [folderName, last]
}



// Compile SCSS imports
function getScssFileName(str, substring) {
  const arr = str.split(substring);
  const filename = arr.pop().replace("_", "").replace(".scss", "")
  arr.shift()
  const cssPath = "../" + arr.join("/") + "/" + filename;
  return cssPath
}

const componentsDir = './.lore/js/components'
const scssFiles = findFilesInDirectory(componentsDir, '.scss');


let imports = ``

scssFiles.forEach((path) => {
  // Add global var
  let scss = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' }).trim();
  if (!scss.includes("@use '../../../css/vars' as *;")) {
    scss = "@use '../../../css/vars' as *;\n\n" + scss
    fs.writeFileSync(path, scss);
  } 

  // save to global import scss
  const filename = getScssFileName(path, '\\')
  imports += `@import "${filename}";\n`
}); 

fs.writeFileSync('./.lore/css/_imports.scss', imports);
console.log("Done compiling scss components into _imports.scss")




// 
// Compile Components js
// 
let components = ``
let componentNames = `
const components = [
`
const jsFIles = findFilesInDirectory(componentsDir, '.js');
jsFIles.forEach((path) => {
  const res = splitOnLast(path, "\\")

  let jsdata = (fs.readFileSync(path, { encoding: 'utf8', flag: 'r' })).trim();
  if (jsdata === "") {
    jsdata = `const ${res[1].replace(".js", "")} = {
  name: "${res[0]}",
  props: {},
  template: \`\`
}`
    fs.writeFileSync(path, jsdata);
  }
  components += jsdata + "\n\n"
  componentNames += "    " + res[1].replace(".js", "") + ",\n"

}); 
componentNames += "  ]"
console.log("Done compiling components to components.js")

//
// Append composables to index.js
//
const composables = findFilesInDirectory('./.lore/js/composables', '.js');
let composablesContent = ``
composables.forEach((path) => {
  const js = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' });
  composablesContent += js.trim() + "\n\n"
})



//
// Append components to index.js
//
let app = fs.readFileSync(`./.lore/js/app.js`, { encoding: 'utf8', flag: 'r' });

let newIndex = `
${app.trim()}

function mount(app) {
  // Mount Components
  ${componentNames.trim()}

  // Register Components
  for (const component of components) {
    app.component(component.name, component);
  }

  return app.mount('#app');
}

// ==================
//     Composables 
// ==================
${composablesContent}

// ==================
//     Components 
// ==================
${components}
`
const options = {
  "js": {
      "mangleClassNames": true,
      "removeUnusedVariables": true,
      "removeConsole": false,
      "removeUselessSpread": true
  },
  "img": {
      "maxSize": 4096
  },
  "html": {
      "removeComments": true,
      "removeCommentsFromCDATA": true,
      "removeCDATASectionsFromCDATA": true,
      "collapseWhitespace": true,
      "collapseBooleanAttributes": true,
      "removeAttributeQuotes": true,
      "removeRedundantAttributes": true,
      "useShortDoctype": true,
      "removeEmptyAttributes": true,
      "removeEmptyElements": false,
      "removeOptionalTags": true,
      "removeScriptTypeAttributes": true,
      "removeStyleLinkTypeAttributes": true,
      "minifyJS": true,
      "minifyCSS": true
  },
  "css": {
      "compatibility": "*"
  }
}

// minify.js(newIndex, options).then((data) => {
//   // console.log(data)
//   fs.writeFileSync(`./.lore/js/index.js`, data);
// }) 
 

 
fs.writeFileSync(`./.lore/js/index.js`, newIndex);



console.log("Done adding components to app")  

