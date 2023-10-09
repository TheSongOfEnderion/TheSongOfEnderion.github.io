
var root; //


var historyList = [];
var globalPosition = null;
var isWebView = false;
var isCurrentPageTemplate = false;

var productionMode = false

class Metadata {
  constructor(metadata) {
    this.metadata = metadata;

    this.directory = this.metadata.directory;
    this.templates = this.metadata.templates;
    this.projectTitle = this.metadata.title;
    this.projectSubtitle = this.metadata.subtitle;

    // Set Metadata
    document.getElementsByTagName("title")[0].innerText = this.projectTitle;
  }

  updateDirKey(oldKey, newKey, metaEntry) {
    if (oldKey !== newKey) {
      delete this.metadata.directory[oldKey];
    }
    this.metadata.directory[newKey] = metaEntry[newKey];
    this.directory = this.metadata.directory
    this.updateLink(newKey);
  }

  deleteDirkey(key) {
    delete this.metadata.directory[key];
  }

  updateLink(newKey) {
    const url = new URL(window.location);
    url.searchParams.set("p", newKey);
    history.replaceState(null, null, ' ');
    history.pushState({}, "", url);
  }

  updateTemplate(oldKey, newKey) {
    

    if (this.metadata.templates.includes(oldKey)) {
      const index = this.metadata.templates.indexOf(oldKey);
      this.metadata.templates[index] = newKey
    } else {
      this.metadata.templates.push(newKey)
    }

    
  }
}

function start() {
  const app = Vue.createApp({
    data() {
      return {
        metadata: { directory: {} },
        directory: {},
        rerender: true,
        toggleState: false,

        // Card
        content: {},
        pageName: "",
        pageId: "",

      }
    },
    async mounted() {

      if (isWebView == true) {
        let script = document.createElement('script')
        script.src = ".lore/js/import/yaml.min.js"
        script.async = true
        document.body.appendChild(script)
      }

      // Get Metadata
      const metadata = await fetchData(".lore/metadata.json");
      this.metadata = new Metadata(metadata);

      // Get Directory
      this.directory = metadata.directory;

      // Get query id
      let pageId = this.getCurrentPageId();

      // Loads page
      this.reload(pageId);

      // Setup forward and backward handler using johanholmerin's code
      window.addEventListener('forward', event => {
        if (globalPosition + 1 < historyList.length) globalPosition++;
        this.reload(historyList[globalPosition], true);
      });

      window.addEventListener('back', event => {
        if (globalPosition !== 0) globalPosition--;
        this.reload(historyList[globalPosition], true);
      });

      setup();
    },
    methods: {

      /**
       * Reloads the page card component
       * @param  {string} pageId id of the page to reload from directory
       * @param  {bool}   isPopState controls the history list
       * @return {none}  Returns nothing
       */
      async reload(pageId, isPopState = false, savePage = "") {

        // Prevents repeated history when the same page button is clicked
        if (savePage == "") {
          if (!isPopState && pageId === historyList[globalPosition]) return;
        }

        // Manipulate history back and forward
        this.history(pageId, isPopState);

        // Get metadata file
        let pageMeta = this.directory[pageId] || this.directory["404"];

        // Update Card Content        
        if (savePage != "") {
          // An editor reload
          this.content = savePage;
        } else {
          // A new page get
          const resp = await fetchData(pageMeta.path);
          if (resp == "Error") {
            // Page is in Metadata.json but doesn't exist
            this.content = createContentObj("The page exist in <span class=\"error\">metadata.json</span> but does not exit");
          } else {
            // Check if page is real or Page does not exist
            if (pageId == "404" || !this.directory.hasOwnProperty(pageId)) {
              pageId = this.getCurrentPageId(true);
              resp.areas.full.tabs.default = resp.areas.full.tabs.default.replace("[[page-id]]", `<span class="error">${pageId}</span>`);
            }
            this.content = this.isContentEmpty(resp);
          }
        }
        
        isCurrentPageTemplate = this.metadata.templates.includes(pageId) ? true : false;

        // Update App
        this.pageId = pageId;
        this.$forceUpdate();
        this.pageName = pageMeta.title;   // Places here so it updates with the content at the same time
        

        const side = document.getElementById("history-content")
        let sidehtml = ``
        for (let i = historyList.length - 1; i >= 0; i--) {
          const page = historyList[i];
          if (!this.metadata.directory.hasOwnProperty(page)) continue
          sidehtml += `<a class="button button--toc H1" onclick="changePage('${page}')">${this.metadata.directory[page].title}</a>`
        }
        side.innerHTML = sidehtml
        

      },
      /**
     * Reloads the page card component
     * @param  {string} pageId id of the page to reload from directory
     * @param  {bool}   isPopState controls the history list
     * @return {none}  Returns nothing
     */
      history(pageId, isPopState) {
        // Deal with Global Positioning
        if (globalPosition === null) globalPosition = 0;
        else if (!isPopState) globalPosition += 1;

        // Clear history before the latest new page
        if (!isPopState && globalPosition >= 0 && globalPosition < historyList.length) {
          historyList.length = globalPosition;
        }

        if (!isPopState) historyList.push(pageId);
      },

      /**
       * Checks if the content json is empty
       * @param  {Object} contentObj json object GET from files
       * @return {Object}  the same object or an empty obj
       */
      isContentEmpty(contentObj) {
        if (contentObj["areas"].hasOwnProperty("full")) {
          const tabs = contentObj["areas"]["full"].tabs;
          if (Object.keys(tabs).length === 1) {
            const tabname = Object.keys(tabs)[0];
            if (tabs[tabname].trim() == "") {
              return createContentObj("The Page is empty");
            }
          }
        }
        return contentObj;
      },
      getCurrentPageId(real = false) {
        let pageId = (new URLSearchParams(window.location.search)).get('p');
        if (real) {
          return pageId;
        }
        if (pageId == null || pageId == "") pageId = "home";
        if (!this.directory.hasOwnProperty(pageId)) pageId = "404";
        return pageId;
      },
      savePage(path, newPage, metaEntry) {
        const key = getKey(metaEntry)[0];
        this.metadata.updateDirKey(this.pageId, key, metaEntry);

        if (isCurrentPageTemplate == true) {
          this.metadata.updateTemplate(this.pageId, key)
          this.pageId = key;
        }
        if (isWebView == true) {
          pywebview.api.savePage(this.pageId, newPage, metaEntry, isCurrentPageTemplate);
        }
        this.pageId = key;
        this.reload(this.pageId, false, newPage);
      },
      deletePage() {
        this.metadata.deleteDirkey(this.pageId);
        changePage("home");

        if (isWebView) {
          pywebview.api.deletePage(this.pageId);
        }
      }
    }
  })

  // https://stackoverflow.com/questions/36170425/detect-click-outside-element
  const clickOutside = {
    beforeMount: (el, binding) => {
      el.clickOutsideEvent = event => {
        // here I check that click was outside the el and his children
        if (!(el == event.target || el.contains(event.target))) {
          // and if it did, call method provided in attribute value
          binding.value();
        }
      };
      document.addEventListener("click", el.clickOutsideEvent);
    },
    unmounted: el => {
      document.removeEventListener("click", el.clickOutsideEvent);
    },
  };

  app.directive("click-outside", clickOutside);
  root = mount(app);


}

function loadYaml() {
  let script = document.createElement('script')
  script.src = ".lore/js/import/yaml.min.js"
  script.async = true
  document.body.appendChild(script)
}


function setup() {
  window.addEventListener('pywebviewready', () => {
    isWebView = true;
    loadYaml();

  });

  // Checks for reload during webview load
  if (typeof window.pywebview !== 'undefined') {
    isWebView = true;
    loadYaml();
  }

  console.log("Is Web view: ", isWebView)
  // source: https://css-tricks.com/snippets/jquery/smooth-scrolling/
  window.scroll({
    top: 2500,
    left: 0,
    behavior: 'smooth'
  });

  // Scroll certain amounts from current position 
  window.scrollBy({
    top: 100, // could be negative value
    left: 0,
    behavior: 'smooth'
  });
}

function mount(app) {
  // Mount Components
  const components = [
    breadcrumbs,
    btn,
    card,
    confirmbox,
    dropdown,
    editmenu,
    editor,
    editorinput,
    editorinputbox,
    framehead,
    modal,
    profilebox,
    searchbox,
    sidebar,
    sidebaredit,
    sidebartoggle,
    spoilerwarning,
    tab,
    toggle,
  ]

  // Register Components
  for (const component of components) {
    app.component(component.name, component);
  }

  return app.mount('#app');
}

// ==================
//     Composables 
// ==================
const autoLinkExclude = [
  "spoiler",
  "spoiler\\",
  "spoiler/",
  "/spoiler",
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
      pageId: match[1].trim().toLowerCase().replace(/\s/gm, "-"),
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
    
    value = value.replace(`[[${item.original_string}]]`, 
                           autoLinkBtn(item.is_custom == true? item.name_toshow : title, 
                                       item.pageId))

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

function changePage(pageId) {
  
  const url = new URL(window.location);  
  url.searchParams.set("p", pageId);
  history.replaceState(null, null, ' ');
  history.pushState({}, "", url);
  
  // Reload vue page
  root.reload(pageId)
  document.querySelector('#app').scrollIntoView();
}

function copyobj(obj) {
  return JSON.parse(JSON.stringify(obj)) 
}

function createContentObj(content) {
  return {
    areas: {
      full: {
        tabs: {
          default: content
        }
      }
    }
  }
}

async function fetchData(url) {

  const resp = await fetch(url, {cache: "no-store"}) // cache no store added because backend pywebview is caching fetch and not updating when newly saved
  if (resp.status === 404) {
    return "Error"
  }
  return await resp.json()
}

const getKey = (obj) => {
  return Object.keys(obj)
}

function isObjEmpty(obj) {
  return Object.keys(obj).length == 0;
}

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

// Source; https://github.com/johanholmerin/popstate-direction

// Keep track of current position
let currentIndex = (history.state && history.state.index) || 0;

// Set initial index, before replacing setters
if (!history.state || !('index' in history.state)) {
  history.replaceState(
    { index: currentIndex, state: history.state },
    document.title
  );
}

// Native functions
const getState = Object.getOwnPropertyDescriptor(History.prototype, 'state')
  .get;
const { pushState, replaceState } = history;

// Detect forward and back changes
function onPopstate() {
  const state = getState.call(history);

  // State is unset when `location.hash` is set. Update with incremented index
  if (!state) {
    replaceState.call(history, { index: currentIndex + 1 }, document.title);
  }
  const index = state ? state.index : currentIndex + 1;

  const direction = index > currentIndex ? 'forward' : 'back';
  window.dispatchEvent(new Event(direction));

  currentIndex = index;
}

// Create functions which modify index
function modifyStateFunction(func, n) {
  return (state, ...args) => {
    func.call(history, { index: currentIndex + n, state }, ...args);
    // Only update currentIndex if call succeeded
    currentIndex += n;
  };
}

// Override getter to only return the real state
function modifyStateGetter(cls) {
  const { get } = Object.getOwnPropertyDescriptor(cls.prototype, 'state');

  Object.defineProperty(cls.prototype, 'state', {
    configurable: true,
    enumerable: true,
    get() {
      return get.call(this).state;
    },
    set: undefined
  });
}

modifyStateGetter(History);
modifyStateGetter(PopStateEvent);
history.pushState = modifyStateFunction(pushState, 1);
history.replaceState = modifyStateFunction(replaceState, 0);
window.addEventListener('popstate', onPopstate);

function splitStringAtLast(inputString, delimiter) {
  const lastIndex = inputString.lastIndexOf(delimiter);
  return lastIndex === -1 ? [inputString] : [inputString.slice(0, lastIndex), inputString.slice(lastIndex + delimiter.length)];
}





// ==================
//     Components 
// ==================
const breadcrumbs = {
  name: "BreadCrumbs",
  data() {
    return {
      crumbs: []
    }
  },
  props: {
    directory: { type: Object, required: true },
    pageId: { type: String }
  },
  watch: {
    pageId: {
      immediate: true,
      deep: true,
      handler(value) {
        if (value.trim() == "") return
        try {
          this.directory[this.pageId].parent 
        } catch (error) {
          console.log(`${this.pageId} has no parent ("" is default). page most likely does not exist. check metadata.json`)
          return
        }
        const parent = this.directory[this.pageId].parent 
        
        let crumbs = []
        const search = (page) => {
          if (!this.directory.hasOwnProperty(page)) return
          crumbs.unshift(page)
          
          const entry = this.directory[page].parent.trim()
          if (entry == "") return
          search(entry)
        }

        search(parent)
        
        crumbs.push(this.pageId)
        
        this.crumbs = crumbs
      }
    }
  },
  methods: {
    link(value) {
      return autoLink(`[[${value}]]`, this.directory)
      
    }
  },
  template: `
  <div class="breadcrumbs" v-if="crumbs.length != 1">
    <template v-for="(value, index) in crumbs">
      <span v-html="link(value)"></span>
       <template v-if="index + 1 != crumbs.length"> » </template>
    </template>
  </div>
  `
}

const btn = {
  name: "Btn",
  props: {
    name: { type:String, required: true },
    bid: { type:String, required: false }, 
    click: { type: Function, required: false },
    isActive: { type: Boolean, required: false  }
  },
  template: `
    <button type="button"
            :class="['btn', isActive == true ? 'btn-active' : '']"
            :id="bid"
            @click="click">{{name}}</button>
  `
}

const card = {
  name: `Card`,
  data() {
    return {
      // Card Data
      areas: {
        full: {
          tabs: {},
          profile: {}
        },
        preview: {
          tabs: {},
          profile: {}
        },
      },

      // Misc
      rerender: true,
      noPreview: false,
    }
  },
  emits: ['processed-content'],
  props: {
    title: { type: String, default: "Ethan Morales" },
    pageId: { type: String },
    content: { type: Object },
    directory: { type: Object, required: true, default: {}},
    toggleState: { type: Boolean }
  },
  components: ['BreadCrumbs', 'SpoilerWarning'],
  watch: {
    content: {
      immediate: true,
      deep: true,
      async handler(value) {      
        // Return if value is empty
        if (isObjEmpty(value)) return;
        
        // Unnecessarily complcated preview removal.        Massive SKILL ISSUE lmao it works
        let areas = copyobj(value['areas']);
        if (areas.hasOwnProperty("preview")) {
          const length = Object.keys(areas["preview"].tabs).length;
          if (length == 1) {
            const tabName = Object.keys(areas["preview"].tabs)[0];
            if (areas["preview"].tabs[tabName].trim().length == 0) {
              delete areas["preview"];
            }
          } else if (length == 0) {
            delete areas["preview"];
          }

        }

        for (const area in areas) {
          for (const tab in areas[area].tabs) {
            
            let content = areas[area].tabs[tab];

            content = content.trim();

            content = this.renderMD(content);

            content = autoLink(content, this.directory);

            areas[area].tabs[tab] = content;
          }
        }
        this.areas = areas;

        // Refresh
        await this.refresh();

        this.makeTOC();
        this.toggleArea();

        this.$emit('processed-content', value);
        

        // Create Tags
        if (this.directory.hasOwnProperty(this.pageId)) {
          const tags = this.directory[this.pageId].tags.trim().split(' ')
          if (tags[0] !== '') {
            const tagdiv = document.getElementById("page-tags");
            let html = ``;
            for (let tag of tags) {
              html += `<button class="button button--autolink" onclick="changePage('tag-${tag}')">${tag}</button>`;
            }
            tagdiv.innerHTML = `<br><hr>${html}`;
  
          } else {
            document.getElementById("page-tags").innerHTML = ``
          }
        } else {
          document.getElementById("page-tags").innerHTML = ``
        }


      }
    },
    toggleState: {
      handler(value) {
        
        this.toggleArea();
      }
    }
  },
  methods: {

    renderMD(value) {

      let md = value.trim().split(/\n/gm);
      let html = ``;
      for (const l of md) {
        let line = l.trim();

        // if empty line
        if (line == "") {
          html += `<p>&nbsp</p>\n`;
          continue;
        }

        // Render Headers
        const hres = line.match(/(#+)\s/);
        if (hres) {
          const h = hres[0].length;
          let btn = ``
          if (h == 2) {
            btn = `<a class="button button--toc" onclick="document.querySelector('#top').scrollIntoView();">↑</a>`;
          } 
          
          html += `<span class="header1">
                      <h${h} class="H${h}">${hres.input.replace(/\#/g,'').trim()}</h${h}>${btn}
                  </span>`
          continue
        }

        const images = line.match(/\[\[img(.*?)\]\]/g)
        if (images) {
          for (const img of images) {
            let cont = img.replace(/\[/g, '').replace(/\]/g, '').trim().split("|")
            cont = cont.filter(item => item);
            let imagetag = ``
            switch(cont.length) {
              case 5:
                // Has url, height, width, alt
                imagetag = `<img src="./assets/${cont[1]}" height="${cont[2]}" width="${cont[3]}" alt="${cont[4]}">`
                break;
              case 4:
                // Has url, height, width
                imagetag = `<img src="./assets/${cont[1]}" height="${cont[2]}" width="${cont[3]}" alt="${cont[1]}">`
                break;
              case 3:
                // Has url, height
                imagetag = `<img src="./assets/${cont[1]}" height="${cont[2]}" width="auto" alt="${cont[1]}">`
                break;
              case 2:
                // Has url
                imagetag = `<img src="./assets/${cont[1]}" height="auto" width="auto" alt="${cont[1]}">`
                break;
              case 1:
                // Has url
                imagetag = `<span class="error">Broken image</span>`
                break;
            }

            console.log(imagetag)
            line = line.replace(img, imagetag)
          }
          console.log(images)
        }
        // Renders Bold
        const bold = [...line.matchAll(/\*\*(.*?)\*\*/g)];
        if (bold.length != 0) {
          for (const b of bold) {
            line = line.replace(b[0], `<b>${b[1]}</b>`);
          }
        }

        // Renders italic
        const italic = [...line.matchAll(/\*(.*?)\*/g)];
        if (italic.length != 0) {
          for (const i of italic) {
            line = line.replace(i[0], `<i>${i[1]}</i>`);
          }
        }

        // Renders List
        const list = line.match(/^\* /);
        if (list) {
          line = `<li>${line.replace("* ", "").trim()}</li>`;
        }

        // Renders List
        const quote = line.match(/^\> /);
        if (quote) {
          line = `<blockquote>${line.replace("> ", "").replace(' - ', '<br> - ').trim()}</blockquote>`;
        }

        // Add to page
        html += `<p>${line}</p>\n`;
      }

      
      return html;
    },
    loadProfile(value) {
      if (!this.hasData(value)) return [value, {}, ""];
      
      // Separate content and profile
      const parts = value.split(this.profileDivisor);
      
      const profileText = parts[1].replace(/=/g, "").trim();
      // Load yaml
      let profile = {};
      try {
        profile = jsyaml.load(autoLink(profileText, this.directory), 'utf8');
      } catch (error) {
        conesole.log("Bad YAML Data on .md file");
        return [value, {}];
      }
      
      // Load content
      const content = parts[2].trim();
    
      return [content, profile, profileText];
    },

    makeTOC() {
      const tabs = document.getElementsByClassName("tab");
      
      for (const tab of tabs) {
        if (!tab.innerHTML.includes("[[toc]]")) return;
        const headers = tab.querySelectorAll("h1, h2, h3, h4, h5, h6");
        let toc = "";

        for (const head of headers) {
          head.id = head.innerText.replace(/\s/g, "-").replace(/\'/g, "-").toLowerCase().replace(/\:/g, "").trim();
          toc += `<a class="button button--toc ${head.tagName}" onclick="document.querySelector('#${head.id}').scrollIntoView();">${head.innerText.replace(/\:/g, "")}</a>\n`;
        } 
        

        const toc_content = `<div class="toc">
                              <h1 class="toc-title">Table of Contents</h1>
                              ${toc}
                            </div>`
        document.getElementById(tab.id).innerHTML = tab.innerHTML.replace("[[toc]]", toc_content);

        
      }
    },

    
    hasData(value) {
      // Check if There is a data for profiles inside
      const equalsIndex1 = value.indexOf(this.profileDivisor);
      const equalsIndex2 = value.lastIndexOf(this.profileDivisor);
      
      if (equalsIndex1 !== -1 && equalsIndex2 !== -1 && equalsIndex1 < equalsIndex2) {
          const textBetweenEquals = value.substring(equalsIndex1 + 1, equalsIndex2);
          return textBetweenEquals.length > 0;
      }
      
      return false;
    },


    async refresh() {
      this.rerender = false;
      await Vue.nextTick();
      this.rerender = true;
    },
    isProfileExist(area) {
      if (!this.areas[area].hasOwnProperty("profile")) {
        return false;
      } else {
        return Object.keys(this.areas[area].profile).length != 0;
      }
    },
    toggleArea() {
      const fullArea = document.getElementById("full-area");
      const previewArea = document.getElementById("preview-area");

      if (!previewArea) {
        this.noPreview = true
        return
      }
      this.noPreview = false
      if (this.toggleState) {
        fullArea.classList.remove("hide");
        previewArea.classList.add("hide");
      } else {
        fullArea.classList.add("hide");
        previewArea.classList.remove("hide");
      }
    }
  },
  template: `
    <div class="card-container">

      
      <div class="card flex flex-c flex-between">
        
        <div>
          <SpoilerWarning :toggle-state="toggleState" :no-preview="noPreview"/>
          <h1 id="title">
            {{ title }}
          </h1>
          <BreadCrumbs :directory="directory" :page-id="pageId" v-if="rerender"/>
          <div v-for="(area, name, index) in areas"
               v-if="rerender"
               :id="name + '-area'"
               >
            <ProfileBox :profile="area.profile" v-if="isProfileExist(name)"/>
          
            <div id="card-content">
                <Tab :tabs="area.tabs"/>
            </div>
          </div>
        </div>



        <div id="page-tags">

          </div>


      </div>

      <!-- <div>© 2021-2023 Aeiddius. All rights reserved.</div> -->

      
      <div id="side-toc" class="toc side-toc">
        <h1 class="toc-title">History</h1>
        <div id="history-content"></div>
      </div>

    </div>
  ` 
}

const confirmbox = {
  name: "Confirmbox",
  props: {
    id: {type: String, required: true },
    message: { type: String, required: true, default: "Default Message" },
    handler: { type: Function}
  },
  methods: {
    close() {
      document.getElementById(this.id).classList.add("hide")
    },
    run() {
      this.handler()
      this.close()
    }
  },
  template: `
    <div class="confirmbox hide" :id="id">
      <div class="box">
        <p>{{ message }}</p>
        <div class="buttons">
          <button class="btn" @click="run">Confirm</button>
          <button class="btn btn-red" @click="close">Cancel</button>
        </div>
      </div>
    </div>

  `
}

const dropdown = {
  name: "Dropdown",
  props: {
    label: { type:String, required: true },
    sid: { type:String }, // Select id
    change: { type: Function },
    optionList: { type: Object, required: true },
    isArray: {type: Boolean, default: false}       
  },
  template: `
    <label :for="sid">{{ label }}</label>
    <!-- Dropdown -->
    <select :id="sid" @change="change" class="dropdown" :title="label">
      
      <template v-if="isArray">
        <option value="">None</option>
        <option :value="value" v-for="(value, name) in optionList">
            {{ value }}
        </option>
      </template>

      <template v-else>
        <option :value="name" v-for="(value, name) in optionList">
            {{ name }}
        </option>
      </template>
    </select>
  `
}

const editmenu = {
  name: "EditMenu",
  props: {
    metadata: { type: Object, required: true, default: {}},
  },
  methods: {
    open() {
      document.getElementById("editor-box").classList.remove("hide");
    },
    add() {
      changePage('add-page');
      isCurrentPageTemplate = false
      this.open();
    },
    openDelete() {
      document.getElementById("delete-confirm").classList.remove("hide");
      console.log(document.getElementById("delete-confirm"));
    },
    async openTemplate() {
      const val = document.getElementById("template-list").value;
      console.log(val);
      
      // const data = await fetchData(`templates/${val}.json`)

      changePage(val)
    },
    deselectTemplate() {
      const elem = document.getElementById("template-list").options;
      
      for(var i = 0; i < elem.length; i++){
        elem[i].selected = false;
      }

    },
    editNav() {
      changePage('nav')
    }
  },
  template: `
    <div id="editmode" class="hide flex flex-c gap-10">
      <h1 class="titles">Edit Mode</h1>

      <div class="flex gap-10">
        <Btn bid="editemenu-edit-page" class="btn--dark" name="Edit" :click="open"/>
        <Btn bid="editemenu-add-page" class="btn--dark" name="Add" :click="add"/>
        <Btn bid="editemenu-delete-page" class="btn--dark btn--red" name="Delete" :click="openDelete"/>   
      </div>


      <Btn bid="editemenu-edit-nav" class="btn--dark" name="Edit Nav" :click="editNav"/>

      <div class="template-list">
        <h2>Templates</h2>
        <select name="Templates"  size="6" @change="openTemplate" id="template-list" title="templates" v-click-outside="deselectTemplate">
          <template v-for="(value, index) in metadata.templates">
            <option :value="value" v-if="index != 'n/a'">{{value}}</option>  
          </template>
        </select>  
      </div>
    </div>
  `
}

const editor = {
  name: "Editor",
  data() {
    return {
      pageData: {},
      pathChoices: [],
      isSaveAsTemplate: false,

      // Check to see if profile is currently edited
      isCurrentProfile: false,

      // area obj
      pageId: "",
      currentArea: "",
      currentTab: "",
      currentAreaObj: {}

      // if new page 
    } 
  },
  components: ['EditorTab', 'EditorInputBox', 'EditorInput', 'Btn', 'Dropdown'],
  emits: ['save-page'],
  props: { 
    metadata: { type: Object, required: true, default: {}},
    curPageId: { type: String, required: true, default: "not working fuck" },
  },
  methods: { 
    start(value){  
      // Set Variables
      this.pageId = this.curPageId;
      this.pageData = copyobj(value["areas"]);
      this.changeArea('full');


      // Create path directory
      const paths = [];
      for (const entryId in this.metadata.directory) {
        const entry = splitStringAtLast(this.metadata.directory[entryId].path, '/')[0];
        const rehashed_path = entry.replace(/\//g, "\\");
        if (!paths.includes(rehashed_path)) paths.push(rehashed_path);
      }
      this.pathChoices = paths.sort();
      
      // Check if template

      document.getElementById("saveAsTemplate").checked = isCurrentPageTemplate;


      // Create parent choices
      if (!this.metadata.directory.hasOwnProperty(this.pageId) || this.pageId === "404") {
        document.getElementById("input-page-name").value = this.pageId;
        document.getElementById("input-page-id").value = this.pageId;
        document.getElementById("input-path").value = "";
        return
      }

      // Set pagename
      
      this.setTemplate()

    },
    changeArea(area) {
      // Area validation CCheck
      if (area == "preview" && !this.pageData.hasOwnProperty("preview")) {
        this.pageData["preview"] = { tabs: { "default": "" } };
      }

      // Set initial variables
      this.isCurrentProfile = false;
      this.currentArea = area;
      this.currentTab = Object.keys(this.pageData[area].tabs)[0];
      this.currentAreaObj = copyobj(this.pageData[area]);

      // Set <Tabs btn active>
      for (const ar of ['full', 'preview']) {
        if (ar == area) this.getNode(`btn-${ar}`).classList.add("btn-active");
        else this.getNode(`btn-${ar}`).classList.remove("btn-active");
      }

      // Remove active status of btn-profile
      this.getNode("btn-profile").classList.remove("btn-active");

      document.getElementById("tab-rename-input").value = this.currentTab;

      // Set <textarea>
      this.refreshTextArea();
    },

    changeTab(event) {
      this.isCurrentProfile = false;
      this.currentTab = event instanceof Event ? event.currentTarget.value : event;
      this.getNode("tab-rename-input").value = this.currentTab;
      this.refreshTextArea();
    },

    async changeTemplate() {
      const select = document.getElementById("template-select");
      if (select.value === "") return;

      console.log("Select: ", select.value)
      const url = this.metadata.directory[select.value].path;

      const data = await fetchData(url);
      this.start(data);
    },

    refreshTextArea(){
      this.getNode("textarea").value = `${this.currentAreaObj.tabs[this.currentTab]}`;
    },

    editProfile() {
      if (this.isCurrentProfile == false) {
        this.isCurrentProfile = true;
        if (typeof jsyaml !== 'undefined') {
          this.getNode("textarea").value = `${jsyaml.dump(this.currentAreaObj.profile, 'utf8')}`;
        } else {
          this.getNode("textarea").value = `JS Yaml not loaded due to this being a web browser and not in pywebview`;
        }
        
        this.getNode("btn-profile").classList.add("btn-active");
      } else {
        this.isCurrentProfile = false;
        this.refreshTextArea();
        this.getNode("btn-profile").classList.remove("btn-active");
      }
    },

    saveTextArea(event) {
      if (this.isCurrentProfile == false) {
        this.pageData[this.currentArea].tabs[this.currentTab] = event.currentTarget.value;
        this.currentAreaObj.tabs[this.currentTab] = event.currentTarget.value;
      } else {
        const profile =  jsyaml.load(event.currentTarget.value.trim(), 'utf8');
        this.pageData[this.currentArea].profile = profile;
        this.currentAreaObj.profile = profile;
      }
    },

    save() {
      const tags = document.getElementById("input-tags").value.trim();
      const parent = document.getElementById("input-parent").value.trim();
      const path = document.getElementById("input-path").value.trim();
      const pageName = document.getElementById("input-page-name").value.trim();
      const pageId = document.getElementById("input-page-id").value.trim();

      // Validation
      if (pageName === "" || pageId === "" || path === ""){
        console.log("pageName|pageId|path are required");
        return;
      }

      // if template
      if (isCurrentPageTemplate === true) {
        if (!pageId.includes("template-")) {
          console.log("Wrong template id format. Must be \"template-name_here\"")
          return
        }
        if (!path.startsWith('templates')) {
          console.log("Wrong template path. Must start at \"templates\\id_here.json\"")
          return
        }
        if (this.pageId == "add-page") this.page = pageId
      }

      // Remves empty preview
      if (this.pageData.hasOwnProperty("preview")) {
        const tabs = this.pageData.preview.tabs;
        const tabsvalue = Object.keys(tabs);
        if (tabsvalue.length == 0 || (tabsvalue.length == 1 && tabs[tabsvalue[0]].trim() == "")) {
          delete this.pageData.preview;
        } 
      }

      // Validates path ending in "/"
      let newPath = path.replace(/\\/g, "/");
      if (!this.isLastCharSlash(newPath)) newPath = newPath + "/";

      // Creates metadata.json entry
      const metaEntry = {
        [pageId]: {
          "title": pageName,
          "path": newPath + pageId.replace(/\ /g, "-") + ".json",
          "parent": parent,
          "tags": tags,
        }
      }

      const newPage = {
        "areas": this.pageData,
        "tags": tags,
        "parent": parent,
      }
      // emits saved page
      this.$emit('save-page', path, newPage, metaEntry);

      console.log("Saved Successfully");
    },
    tabNew() {
      // Checks if new tab name is empty
      const tabname = this.getNode('tab-new-input').value.trim();
      if (tabname === "") return;

      // Checks if tabname exists already
      const tabs = Object.keys(this.currentAreaObj.tabs);
      if (tabs.includes(tabname)) return;

      // Adds new tabname
      this.pageData[this.currentArea].tabs[tabname] = "";
      
      // Refresh
      this.changeArea(this.currentArea);
    },
    tabRename() {
      // Checks if renamed tab is empty
      const tabname = this.getNode('tab-rename-input').value.trim();
      if (tabname === "") return;

      // Checks if tabname exists already
      const tabs = Object.keys(this.currentAreaObj.tabs);
      if (tabs.includes(tabname)) return;

      // Save current tab
      this.pageData[this.currentArea].tabs[tabname] = `${this.pageData[this.currentArea].tabs[this.currentTab]}`;
      
      // Delete tab
      delete this.pageData[this.currentArea].tabs[this.currentTab];

      // Refresh
      this.changeArea(this.currentArea);
    },
    tabDelete() {
      // delete this.pageData

      const keys = Object.keys(this.pageData[this.currentArea].tabs).length;
      if (keys == 1) return

      delete this.pageData[this.currentArea].tabs[this.currentTab];

      // Refresh
      this.changeArea(this.currentArea);
    },
    openTabbtn(id) {
      if (id==='new') {
        this.$refs.tabnew.toggle();
      } else if (id === 'rename') {
        this.$refs.tabrename.toggle();
      }
    },
    closeTabbtn(id) {
      this.getNode(`tab-${id}-btn`).classList.remove("btn-active");
      this.getNode(`tab-${id}`).classList.add('hide');
    },

    saveTemplate() {

      const checked = document.getElementById("saveAsTemplate").checked;

      isCurrentPageTemplate = checked;
      this.setTemplate();
    },


    setTemplate() {
      const pageId = document.getElementById("input-page-id")
      const pageName = document.getElementById("input-page-name")
      const path = document.getElementById("input-path")
      const parent = document.getElementById("input-parent")

      if (isCurrentPageTemplate && !this.metadata.templates.includes(this.pageId)) {
        pageId.value = "template-"
        pageName.value = "Template: "
        path.value = "templates/"
        parent.value = "templates"
      } else {
        pageId.value = this.pageId == "add-page" ? "" : this.pageId;
        pageName.value = this.pageId == "add-page" ? "" : this.metadata.directory[this.pageId].title;
        path.value = this.pageId == "add-page" ? "" : this.metadata.directory[this.pageId].path.replace(`${this.pageId}.json`, "").replace(/\//g, "\\");
        parent.value = this.pageId == "add-page" ? "" : this.metadata.directory[this.pageId].parent;
      }

    },

    exit() {
      this.getNode("editor-box").classList.add("hide");
    },
    getNode(id) {
      return document.getElementById(id);
    },
    oninput(e) {
      if (e.target.value.trim() == "") {
        e.target.classList.add("invalid");
        return;
      }
      if (e.target.classList.contains("invalid")) {
        e.target.classList.remove("invalid");
      }
    },

    isLastCharSlash(inputString) {
      // Get the last character of the string
      var lastChar = inputString.slice(-1);
    
      // Check if the last character is "/"
      return lastChar === "/";
    }
  },
  mounted() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const editor = document.getElementById("editor-box").classList;
        if (!editor.contains("hide")) {
          editor.add("hide");
        }
      }
  });
  },
  template: `
  <div id="editor-box" class="editor-container hide">

    <div id="editor" class="flex">      

      <div class="textbox">
        <h1>Editor</h1>
        
        <!-- Header input -->
        <div class="path-select flex width-100 flex-align">
            <div class="width-100">
              <table class="table width-100">
                <!-- Data Input -->
                <tr>
                  <td><label for="input-page-name">Name:</label></td>
                  <td><input class="input width-100" id="input-page-name" @input="(event) => oninput(event)" v-on:blur="oninput"></td>
                  <td><label for="input-page-id">Id</label></td>
                  <td><input class="input width-100" id="input-page-id" @input="(event) => oninput(event)" v-on:blur="oninput"></td>
                </tr>

                <!-- Path selector -->
                <tr>
                  <td class="category"><label for="input-path">Path</label>:</td>
                  <td colspan="100%">
                    <input type="text" name="editor" list="path-choices" 
                       class="input width-100" id="input-path"
                       placeholder=""  @input="(event) => oninput(event)" v-on:blur="oninput">
                    <datalist id="path-choices">
                      <option :value="value" v-for="(value, index) in pathChoices">
                      </option>
                    </datalist>
                  </td>
                </tr>
              </table>
            </div>
        </div>
        <!-- Header Input -->


        <!-- Textarea -->
        <textarea name="background-color: white;" id="textarea"
                  placeholder="Write here..."
                  @change="saveTextArea"></textarea>      
      </div>

      <!-- Settings -->
      <div class="editor-options flex flex-c pos-relative">

        <!-- Mode buttons -->
        <span class="flex">
          <Btn bid="btn-full" :is-active="true" name="Full" :click="() => changeArea('full')"/>
          <Btn bid="btn-preview" name="Preview" :click="() => changeArea('preview')"/>
        </span>

        <Btn bid="btn-profile" name="Edit Profile"
             :click="editProfile"/>

        <!-- Select Tab -->
        <div class="tab-options flex flex-c mt-15">
          <!-- Dropdown -->
          <Dropdown label="Tabs"
                    sid="tab-select"
                    :change="changeTab"
                    :option-list="currentAreaObj.tabs"
                    v-if="Object.keys(currentAreaObj).length != 0"
                    />

          <!-- Edit -->
          <span class="flex">
            <Btn bid="tab-new-btn" name="New"
                 :click="() => openTabbtn('new')"/>
                 
            <Btn bid="tab-rename-btn" name="Rename"
                 :click="() => openTabbtn('rename')"/>
          </span>
          <Btn bid="tab-delete-btn" name="Delete"
               :click="() => tabDelete('delete')"/>
        
        </div>
        <!-- Select Tab -->

        
        <!-- Tags -->
        <EditorInput label="Tags"
                     iid="input-tags"
                     placeholder="tagA tagB tagC"/>
                     
        <!-- Parent -->
        <EditorInput label="Parent"
                     iid="input-parent"
                     did="parent-choices"
                     placeholder="home"
                     :datalist="Object.keys(this.metadata.directory).sort()"/>

        <hr class="hr">
   
          <!-- Template -->
          <Dropdown label="Templates"
                    sid="template-select"
                    :option-list="this.metadata.templates"
                    :change="changeTemplate"
                    :isArray="true"
                    v-if="Object.keys(currentAreaObj).length != 0"/>

          <div class="checkbox">
            <input type="checkbox" name="saveAsTemplate" id="saveAsTemplate" @change="saveTemplate">
            <span for="saveAsTemplate">Save as Template</span>
          </div>

 
        <!-- Tab:New -->
        <EditorInputBox ref="tabnew" 
                        label="New Tab"
                        iid="tab-new-input"
                        obid="tab-new-btn"
                        placeholder="home"
                        :ok-handler="tabNew"/>        

        <!-- Tab:Rename -->
        <EditorInputBox ref="tabrename" 
                        label="Rename Tab"
                        iid="tab-rename-input"
                        obid="tab-rename-btn"
                        placeholder="home"
                        :ok-handler="tabRename"
                       />
        
        <div class="flex float-bottom width-100">
          <button class="btn btn-green" @click="save">Save</button>
          <button class="btn btn-red" @click="exit">Exit</button>
        </div>
      </div>
      <!-- Settings -->
    
    </div> 

  </div>
  `
}

const editorinput = {
  name: "EditorInput",
  props: {
    label: { type:String, required: true },
    iid: { type:String, required: true },
    did: { type:String },
    placeholder: { type:String},
    datalist:  { type: Array }
  },
  template: `
    <div class="flex flex-c mt-15">
      <label :for="iid">{{ label }}</label>
      <input type="text" :id="iid" class="input width-100"
             :placeholder="placeholder" :list="did">
      <template v-if="datalist">
        <datalist  datalist :id="did">
          <option :value="value" v-for="(value, index) in datalist"></option>
        </datalist>
      </template>

    </div>

  `
}

const editorinputbox = {
  name: "EditorInputBox",
  data() {
    return {
      bid: makeid(5)
    }
  },
  props: {
    label: { type:String, required: true },
    iid: { type:String, required: true }, // Input id
    obid: { type:String, required: true }, // Open Button id
    placeholder: { type:String},
    okHandler: {type: Function, },
  },
  methods: {
    toggle() {
      document.getElementById(this.bid).classList.toggle("hide")
      document.getElementById(this.obid).classList.toggle("btn-active")
    },
    ok() {
      this.okHandler()
      this.cancel()
      this.removeBtnHighight()
    },
    cancel() {
      document.getElementById(this.bid).classList.add("hide")
      this.removeBtnHighight()
    },
    removeBtnHighight() {
      document.getElementById(this.obid).classList.remove("btn-active")
    }
  },
  template: `

  <div class="flex flex-c boxes hide" :id="bid">
    <label :for="iid">{{label}}</label>
    <input type="text" :id="iid" class="input width-100"
           :placeholder="placeholder">

    <div class="flex">
      <button type="button" class="btn" @click="ok">Ok</button>
      <button type="button" class="btn" @click="cancel">Cancel</button>
    </div>
  </div>       

  
  `
}

const framehead = {
  name: "Framehead",
  props: {},
  template: `

    <div class="frame">
      asdasds
    </div>
  ` 
}

const modal = {
  name: "Modal",
  props: {},
  template: ``
}

const profilebox = {
  name: "ProfileBox",
  props: {
    profile: { type: Object }
  },
  template: `
    <div class="profilebox">
      <!-- Title -->
      <template v-if="profile.Title">
        <span class="profile--title">
          {{ profile.Title }}
        </span>
      </template>

      <!-- Image -->
      <template v-if="profile.Image">
          <Tab :tabs="profile.Image" type="image"/>      
      </template>

      <template v-if="profile.Content">
      <!-- Body  -->
        <table>
          <tbody>
          <template v-for="(category_content, category) in profile.Content">
            <!-- Category name -->
            <tr class="category" v-if="category !== 'Desc'"> 
              <td class="category--name" colspan="100%">{{ category }}</td>
            </tr>
            
            <!-- Content -->
            <template v-for="(entry_value, entry) in category_content">
            <tr>
              <td class="entry--name">{{entry}}</td>
              <td>
                 <!-- If content is a list -->
                 <template v-if="Array.isArray(entry_value)">
                  <ul class="entry--value">
                    <li v-for="(list_value, index) of entry_value" v-html="list_value"></li>      
                  </ul>
                </template>
                <!-- if content is simply a string -->
                <template v-else>
                  <span class="entry--value" v-html="entry_value"></span>
                </template>
              </td>
            </tr>
            </template>
          </template>

          </tbody>
        </table>

      </template>

    </div>
  `
}

const gotoPage = (pageId) => {
  document.getElementById("searchbox").value  = ''

  document.getElementById("suggestions").innerHTML = ''
  changePage(pageId)

}

const removeSuggestions = () => {
  // document.getElementById("suggestions").innerHTML = ''

}

const searchbox = {
  name: "Searchbox",
  data() {
    return {
      pages: []
    }
  },
  props: {
    directory: { type: Object, required: true, default: {}},
  },
  watch: {
    directory: {
      immediate: true,
      deep: true,
      handler(value) {
        if (isObjEmpty(value)) return

        this.pages = []

        for (const entry in value) {
          const item = value[entry].title
          this.pages.push({name: item, pageId: entry})
        }
      }
    }
  },
  methods: {
    suggest() {
      const val = document.getElementById("searchbox").value.trim()
      const sugs = document.getElementById("suggestions")

      let suggestedList = []

      for (const entry of this.pages) {
        if (entry.name.toLowerCase().includes(val.toLowerCase().trim())) {
          suggestedList.push(entry)
        }
      } 

      sugs.innerHTML = ''

      for (const item of suggestedList) {
        sugs.insertAdjacentHTML('beforeend', `
        <div class="suggestion-item" onclick="gotoPage('${item.pageId}')">
          ${item.name}
        </div>
      `);
      }
      
    }
  },
  template: `
    <div class="searchbox-area">
      <input type="text" placeholder="Search.."
             class="searchbox"
             id="searchbox" onfocusout="removeSuggestions()" @keyup="suggest">
      <div id="suggestions"></div>
    </div>

     
  `
}

const sidebar = {
  name: "Sidebar",
  data() {
    return {
      navs: {},

    }
  },
  components: ['Searchbox', 'Toggle', 'Editbar'],
  computed: {
    isCurrentNav() {
      let pageId = (new URLSearchParams(window.location.search)).get('p')
      if (pageId == null || pageId == "") pageId = "home"
      return pageId
    }
  },
  props: {
    metadata: { type: Object, required: true},
    rerender: { type: Boolean, default: true }
  },
  watch: {
    metadata: {
    immediate: true,
    deep: true,
    async handler(value) {
        const resp = await fetchData("assets/nav.json")
        const navs = resp.areas.full.tabs.default.trim().split("\n")


        let lastNav = ""
        for (const nav of navs) {
          const newnav = nav.replace(/\[\]/g, "").trim()
          if (newnav == "") continue;
          
          // if has subnav
          if (newnav.startsWith("- ")) {
            this.navs[lastNav]['subnav'][newnav] = autoLink(nav.replace(/\-\s/, ''), this.metadata.directory)
            continue
          }
          
          // if No subnav
          this.navs[newnav] = {
            main: autoLink(nav, this.metadata.directory),
            subnav: {}
          }
          lastNav = newnav
        }    
      }
    }
  },
  methods: {
    closeSidebar() {
      document.getElementById("sidebarobj").style.top = "-5000px";
      document.getElementById("sidebaropen").style.display = "block";
    },
    toggleSubNav(navid) {
      document.getElementById(navid).classList.toggle("hide-subnav")
    },
    getNameClean(name) {
      return name.replace(/\[/g, "").replace(/\]/g, "").trim().toLowerCase()
    },
    expand(navId) {
      const subnav = document.getElementById(navId)
      if (subnav) {
        subnav.classList.remove("hide-subnav")
      }
    },
    collapse(navId) {
      const subnav = document.getElementById(navId)
      if (subnav) {
        subnav.classList.add("hide-subnav")
      }
    },
    hidesidebar() {
      if (window.innerWidth < 800) {
        this.pos = document.getElementById("sidebarobj")
        this.card = document.getElementsByClassName("card")[0]
        
        this.pos.style.left = "-500px" 
        this.card.style.marginLeft = "0px"
      }
    },
  },
  template: `
  
  <div class="sidebar" v-click-outside="hidesidebar">


    <SidebarEdit :projectTitle="metadata.projectTitle"></SidebarEdit>

 

    <div class="user" id="sidebarobj" style="left: 0px;">
      
      <EditMenu :metadata="metadata" v-if="rerender"/>

      <div id="navigation">
        <button class="close" @click="closeSidebar">✕</button>
        <!-- Titles section -->
        <div class="titles">
          <h1 class="title">{{ metadata.projectTitle }}</h1>
          <h2 class="subtitle">{{ metadata.projectSubtitle }}</h2>
        </div>
        <!-- Search Box -->
      <div class="inputs">
      <Searchbox :directory="metadata.directory"/> 
        </div>
        
        <!-- Navigation Links -->
        <div class="nav-links" v-if="rerender">
          <template v-for="(value, name, index) in navs">
        
              <!-- Main Button -->
              <span v-html="value.main"
                    :class="['button--mainnav', isCurrentNav== getNameClean(name) ? 'button--active' : '']"
                    ></span>
                    <!-- @mouseover="expand(name + '-navid')" -->
              <button v-if="Object.keys(value.subnav).length != 0"
                      class="button button--showsub"
                      @click="toggleSubNav(name + '-navid')">
                      ✢
              </button><br>
        
              <!-- Sub button -->
              <div v-if="Object.keys(value.subnav).length != 0"
                   class="button--subnav hide-subnav"
                   :id="name + '-navid'">
                   <!-- @mouseleave="collapse(name + '-navid')" -->
                <template v-for="(valuesub, namesub, indexsub) in value.subnav">
                  <span v-html="valuesub" class="button--mainnav"></span>
                  <br>
                </template>
              </div>
          </template>
        </div>
      </div>
    </div>



  </div>
`
}

const sidebaredit = {
  name: "SidebarEdit",
  data() {
    return {
      nav: "",
      edit: "",
    }
  },
  props: {
    projectTitle: { type: String, required: true, default:""},
  },
  methods: {
    openEditMenu() {
      this.nav.classList.toggle("hide")
      this.edit.classList.toggle("hide")
    },
    openEditor() {
      document.getElementById("editor-box").classList.remove("hide")
    },
    addPage() {
      changePage('add-page')
      isCurrentPageTemplate = false
      this.openEditor()
    },
    openDelete() {
      document.getElementById("delete-confirm").classList.remove("hide")
      console.log(document.getElementById("delete-confirm"))
    }
  },
  mounted() {
    this.nav = document.getElementById("navigation")
    this.edit = document.getElementById("editmode")
  },
  template: `
    <div class="editor-bar">
      <SidebarToggle/>
      
      <Toggle :projectTitle="projectTitle"/>
      <button class="button--sidebaredit"
              id="sidebaredit"
              @click="openEditMenu"
              title="open edit menu button"
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 16 16">
                <path d="M8.00004 4.75421C6.20745 4.75421 4.75427 6.20739 4.75427 7.99997C4.75427 9.79256 6.20745 11.2457 8.00004 11.2457C9.79262 11.2457 11.2458 9.79256 11.2458 7.99997C11.2458 6.20739 9.79262 4.75421 8.00004 4.75421ZM5.75427 7.99997C5.75427 6.75967 6.75973 5.75421 8.00004 5.75421C9.24034 5.75421 10.2458 6.75967 10.2458 7.99997C10.2458 9.24027 9.24034 10.2457 8.00004 10.2457C6.75973 10.2457 5.75427 9.24027 5.75427 7.99997Z"/>
                <path d="M9.79647 1.34338C9.26853 -0.447793 6.73147 -0.447791 6.20353 1.34338L6.10968 1.66179C5.95246 2.19519 5.34321 2.44755 4.85487 2.18155L4.56336 2.02276C2.9235 1.12953 1.12953 2.9235 2.02276 4.56336L2.18155 4.85487C2.44755 5.34321 2.19519 5.95246 1.66179 6.10968L1.34338 6.20353C-0.447793 6.73147 -0.447791 9.26853 1.34338 9.79647L1.66179 9.89032C2.19519 10.0475 2.44755 10.6568 2.18155 11.1451L2.02276 11.4366C1.12953 13.0765 2.92349 14.8705 4.56335 13.9772L4.85487 13.8184C5.34321 13.5524 5.95246 13.8048 6.10968 14.3382L6.20353 14.6566C6.73147 16.4478 9.26853 16.4478 9.79647 14.6566L9.89032 14.3382C10.0475 13.8048 10.6568 13.5524 11.1451 13.8184L11.4366 13.9772C13.0765 14.8705 14.8705 13.0765 13.9772 11.4366L13.8184 11.1451C13.5524 10.6568 13.8048 10.0475 14.3382 9.89032L14.6566 9.79647C16.4478 9.26853 16.4478 6.73147 14.6566 6.20353L14.3382 6.10968C13.8048 5.95246 13.5524 5.34321 13.8184 4.85487L13.9772 4.56335C14.8705 2.92349 13.0765 1.12953 11.4366 2.02276L11.1451 2.18155C10.6568 2.44755 10.0475 2.19519 9.89032 1.66179L9.79647 1.34338ZM7.16273 1.6261C7.40879 0.7913 8.59121 0.791301 8.83727 1.6261L8.93112 1.94451C9.26845 3.08899 10.5757 3.63046 11.6235 3.05972L11.915 2.90094C12.6793 2.48463 13.5154 3.32074 13.0991 4.08501L12.9403 4.37653C12.3695 5.42433 12.911 6.73155 14.0555 7.06888L14.3739 7.16273C15.2087 7.40879 15.2087 8.59121 14.3739 8.83727L14.0555 8.93112C12.911 9.26845 12.3695 10.5757 12.9403 11.6235L13.0991 11.915C13.5154 12.6793 12.6793 13.5154 11.915 13.0991L11.6235 12.9403C10.5757 12.3695 9.26845 12.911 8.93112 14.0555L8.83727 14.3739C8.59121 15.2087 7.40879 15.2087 7.16273 14.3739L7.06888 14.0555C6.73155 12.911 5.42433 12.3695 4.37653 12.9403L4.08501 13.0991C3.32074 13.5154 2.48463 12.6793 2.90093 11.915L3.05972 11.6235C3.63046 10.5757 3.089 9.26845 1.94452 8.93112L1.6261 8.83727C0.7913 8.59121 0.791301 7.40879 1.6261 7.16273L1.94451 7.06888C3.08899 6.73155 3.63046 5.42433 3.05972 4.37653L2.90093 4.08501C2.48463 3.32073 3.32074 2.48463 4.08501 2.90093L4.37653 3.05972C5.42432 3.63046 6.73155 3.089 7.06888 1.94452L7.16273 1.6261Z"/>
              </svg>
      </button>
      <button class="button--sidebaredit" @click="openEditor" title="open editor button">
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="25" viewBox="0 0 12 16">
          <path d="M12 4.5V14C12 15.1046 11.1046 16 10 16H2C0.895431 16 0 15.1046 0 14V2C0 0.89543 0.895431 0 2 0H7.5L12 4.5ZM9 4.5C8.17157 4.5 7.5 3.82843 7.5 3V1H2C1.44772 1 1 1.44772 1 2V14C1 14.5523 1.44772 15 2 15H10C10.5523 15 11 14.5523 11 14V4.5H9Z"/>
          <path d="M6.64645 6.64645C6.84171 6.45118 7.15829 6.45118 7.35355 6.64645L9.35355 8.64645C9.54882 8.84171 9.54882 9.15829 9.35355 9.35355L7.35355 11.3536C7.15829 11.5488 6.84171 11.5488 6.64645 11.3536C6.45118 11.1583 6.45118 10.8417 6.64645 10.6464L8.29289 9L6.64645 7.35355C6.45118 7.15829 6.45118 6.84171 6.64645 6.64645Z"/>
          <path d="M5.35355 6.64645C5.15829 6.45118 4.84171 6.45118 4.64645 6.64645L2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355L4.64645 11.3536C4.84171 11.5488 5.15829 11.5488 5.35355 11.3536C5.54882 11.1583 5.54882 10.8417 5.35355 10.6464L3.70711 9L5.35355 7.35355C5.54882 7.15829 5.54882 6.84171 5.35355 6.64645Z"/>
        </svg>
      </button>
      <button class="button--sidebaredit" @click="addPage" title="add page button">
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 16 16">
          <path d="M8 6.5C8.27614 6.5 8.5 6.72386 8.5 7V8.5H10C10.2761 8.5 10.5 8.72386 10.5 9C10.5 9.27614 10.2761 9.5 10 9.5H8.5V11C8.5 11.2761 8.27614 11.5 8 11.5C7.72386 11.5 7.5 11.2761 7.5 11V9.5H6C5.72386 9.5 5.5 9.27614 5.5 9C5.5 8.72386 5.72386 8.5 6 8.5H7.5V7C7.5 6.72386 7.72386 6.5 8 6.5Z"/>
          <path d="M14 4.5V14C14 15.1046 13.1046 16 12 16H4C2.89543 16 2 15.1046 2 14V2C2 0.89543 2.89543 0 4 0H9.5L14 4.5ZM11 4.5C10.1716 4.5 9.5 3.82843 9.5 3V1H4C3.44772 1 3 1.44772 3 2V14C3 14.5523 3.44772 15 4 15H12C12.5523 15 13 14.5523 13 14V4.5H11Z"/>
        </svg>
      </button>
      
      <button class="button--sidebaredit" @click="openDelete" title="delete page button">
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="26" viewBox="0 0 12 16">
          <path d="M4.85355 7.14645C4.65829 6.95118 4.34171 6.95118 4.14645 7.14645C3.95118 7.34171 3.95118 7.65829 4.14645 7.85355L5.29289 9L4.14645 10.1464C3.95118 10.3417 3.95118 10.6583 4.14645 10.8536C4.34171 11.0488 4.65829 11.0488 4.85355 10.8536L6 9.70711L7.14645 10.8536C7.34171 11.0488 7.65829 11.0488 7.85355 10.8536C8.04882 10.6583 8.04882 10.3417 7.85355 10.1464L6.70711 9L7.85355 7.85355C8.04882 7.65829 8.04882 7.34171 7.85355 7.14645C7.65829 6.95118 7.34171 6.95118 7.14645 7.14645L6 8.29289L4.85355 7.14645Z"/>
          <path d="M12 14V4.5L7.5 0H2C0.895431 0 0 0.89543 0 2V14C0 15.1046 0.895431 16 2 16H10C11.1046 16 12 15.1046 12 14ZM7.5 3C7.5 3.82843 8.17157 4.5 9 4.5H11V14C11 14.5523 10.5523 15 10 15H2C1.44772 15 1 14.5523 1 14V2C1 1.44772 1.44772 1 2 1H7.5V3Z"/>
        </svg>
      </button>
    </div>
  ` 
}

const sidebartoggle = {
  name: "SidebarToggle",
  data() {
    return {
      pos: "",
      card: "",
      lastWidth: 0,
      checked: false,
    }
  }, 
  methods: {
    openSidebar() {
      
      if (this.pos.style.left == "0px") {
        this.sideClose()
      } else {
        this.pos.style.left = "0px"
        if (window.innerWidth > 800) this.card.style.marginLeft = "calc(300px - 70px)"
      }

    },
    sideOpen() {
      this.pos.style.left = "0px"
      this.card.style.marginLeft = "calc(300px - 70px)"
    },
    sideClose() {
      this.pos.style.left = "-500px" 
      this.card.style.marginLeft = "0px"
    },
    isOpen() {
      return this.pos.style.left == "0px"
    },
    getElements() {
      this.pos = document.getElementById("sidebarobj")
      this.card = document.getElementsByClassName("card")[0]
    }
  },
  mounted() {
    this.getElements();

    if (window.innerWidth > 800) {
      // Open
      this.sideOpen()
    } else {
      // Close
      this.sideClose()
    }

    window.addEventListener('resize', ()=> {
      
      // Negative - Openig to the right
      if (this.lastWidth - window.innerWidth < 0) {
        
        // Positive - Closing to the left
      } else if (this.lastWidth - window.innerWidth > 0) {
        if (this.isOpen() == false) return
      }

      this.lastWidth = window.innerWidth

      if (window.innerWidth > 800) {
        // Open
        this.sideOpen()
      } else {
        // Close
        this.sideClose()
      }
    });
  },
  template: `
    <button class="button--sidebaredit"
            id="sidebaropen"
            @click="openSidebar"
            title="open sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
              <path d="M0 3C0 1.89543 0.895431 1 2 1H14C15.1046 1 16 1.89543 16 3V13C16 14.1046 15.1046 15 14 15H2C0.895431 15 0 14.1046 0 13V3ZM5 2V14H14C14.5523 14 15 13.5523 15 13V3C15 2.44772 14.5523 2 14 2H5ZM4 2H2C1.44772 2 1 2.44772 1 3V13C1 13.5523 1.44772 14 2 14H4V2Z"/>
            </svg>
    </button>
  `
}

const spoilerwarning = {
  name: "SpoilerWarning",
  props: {
    toggleState: { type: Boolean, required: true },
    noPreview: { type: Boolean, required: true },
  }, 
  template: `
    <div class="warning" v-if="noPreview == false">


        <span v-if="toggleState == true" class="content spoiler">
          Spoiler Mode
        </span>
        <span v-if="toggleState == false"  class="content">
          Preview Mode
        </span>

    </div>
  `
}

const tab = {
  name: "Tab",
  data() {
    return {
      groupclass: "",
      buttonclass: ""
    }
  },
  props: {
    tabs: { type: Object, required: true },
    type: { type: String, default: "text" },
    btnClass: { type: String, default: '' }
  },
  mounted(){
    this.groupclass = makeid(6)
    this.buttonclass = makeid(6)

    // const tabs = document.getElementsByClassName("tab")
    // for (let tab of tabs) {
    //   if (!tab.classList.contains("hide")) {
    //     console.log(tab)
    //   }
    // }

  },
  methods: {

    toggleTab(name) {
      // Make target tab appear
      const targetTab = `${name}-${this.groupclass}-content`
      const tabs = document.getElementsByClassName(this.groupclass)
      for (const tab of tabs) {
      if (tab.id == targetTab) {
          tab.classList.remove("hide")

          // const toc = tab.getElementsByClassName("toc")
          // if (toc) {
          //   const toc_ = toc[0]
          //   document.getElementById("side-toc").innerHTML = toc_.innerHTML
          //   console.log(toc_)
          // }
          continue;
        } 
        tab.classList.add("hide");
      }

      // Highlight target button
      const targetBtn = `${name}-${this.buttonclass}-button`
      const buttons = document.getElementsByClassName(this.buttonclass)
      for (const btn of buttons) {
        if (btn.id == targetBtn) {
          btn.classList.add("button--active")
          continue
        }
        btn.classList.remove("button--active")
      }
    }

  },
  template: `

      <div class="tab-buttons">
        <template v-for="(value, name, index) in tabs">
          <button v-if="Object.keys(tabs).length != 1"
                  :id="name + '-' + buttonclass + '-button'"
                  :class="['button', index == 0 ? 'button--active' : '', buttonclass, btnClass]"
                  @click="toggleTab(name)">
            {{ name }}      
          </button>
        </template>
      </div>

      <template v-for="(value, name, index) in tabs">
        <template v-if="type === 'text'">
          <div :id="name + '-' + groupclass + '-content'"
               :class="[groupclass, index == 0 ? '' : 'hide', 'tab']"
               v-html="value">
          </div>
        </template>
        <template v-if="type === 'image'">
          <img :id="name + '-' + groupclass + '-content'"
               :class="[groupclass, index == 0 ? '' : 'hide']"
               :src="value"
               :alt="name"
               class="profile--image"/>
          
        </template>
      </template>

  `
}

const toggle = {
  name: "Toggle",
  data() {
    return {
      uniqueId: ""
    }
  },
  props: {
    projectTitle: { required: true }
  },
  watch: {
    projectTitle: {
      handler(value) {
        if (typeof value === undefined) return
        this.uniqueId = this.projectTitle.toLowerCase().trim().replace(/\s/g, "-")+"-storage"

        if (localStorage.getItem(this.uniqueId) === null) {
          localStorage.setItem(this.uniqueId, "false");
        } 
        // localStorage.setItem(this.uniqueId, "false");
        const toggleState = localStorage.getItem(this.uniqueId)
        document.getElementById("switch").checked = toggleState === "true" ? true : false

        root.toggleState = document.getElementById("switch").checked
        
      }
    }
  },
  methods: {
    toggleArea() {
      const toggleState = document.getElementById("switch").checked
      localStorage.setItem(this.uniqueId, toggleState);
      root.toggleState = toggleState
    }
  },
  template: `
    <div class="toggle">
      <input type="checkbox" id="switch" @click="toggleArea"/>
      <label for="switch">Toggle</label>
    </div>
  `
}


