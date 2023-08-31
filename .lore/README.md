

# Files
`.gitignore` - files and folders to ignore for the github commit

`.nojekyll` - disables the default jekyll on github pages



# Automatic scss and js import
The `compile.js` script inside `js/scripts` automatically adds an import statement on the `_imports.scss` in the css folder, allowing it to be combined with the `style.scss`. Consequently, it also copies every component js inside the components folder and compiles it into thte `components.js`.

To run this, install [Run on Save](https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave) on vscode and it will automatically run `compile.js` when you save a `.js` and `.scss` file.

Configure the `emeraldwalk.runonsave` on `.vscode/settings.json` to edit the run on save.