
var root; //


var historyList = [];
var globalPosition = null;


function start() { 
  const app = Vue.createApp({
    data() {
      return {
        directory: {},
        rerender: true,
        toggleState: false,

        // Sidebar
        projectTitle: "",
        projectSubtitle: "",
        
        // Card
        content: {},
        pageName: "",
        pageId: "",

      }
    },
    async mounted() {
      // Get Metadata
      const metadata = await this.fetchData(".lore/metadata.json")

      // Save key-info
      this.projectTitle = metadata.title;
      this.projectSubtitle = metadata.subtitle;
      document.getElementsByTagName("title")[0].innerText = this.projectTitle;

      // Get Directory
      this.directory = metadata.directory
      
      // Get query id
      let pageId = this.getCurrentPageId();

      // Loads page
      this.reload(pageId)

      // Setup forward and backward handler using johanholmerin's code
      window.addEventListener('forward', event => {
        if (globalPosition+1 < historyList.length) globalPosition++
        this.reload(historyList[globalPosition], true)
        console.log(event)
      });

      window.addEventListener('back', event => {
        if (globalPosition !== 0) globalPosition--
        this.reload(historyList[globalPosition], true)
        console.log(event)
      });

      setup()

    },
    methods: {
      async fetchData(url) {
        try {
          console.log("Working: ", NL_OS)
        } catch (error) {
          const resp = await fetch(url)
          if (resp.status === 404) {
            console.log("test")
            return "Error"
          }
          return (await resp.json())

        }

      },
      async reload(pageId, isPopState = false, savePage="") {

       
        // Prevents repeated history when the same page button is clicked
        if (savePage == "") {
          if (!isPopState && pageId === historyList[globalPosition]) return;
        }
                
        // Deal with Global Positioning
        if (globalPosition === null) globalPosition = 0;
        else if (!isPopState) globalPosition += 1;
      
        // Clear history before the latest new page
        if (!isPopState && globalPosition >= 0 && globalPosition < historyList.length) {
          historyList.length = globalPosition;
        }
      
        if (!isPopState) historyList.push(pageId);
      
        // Get metadata file
        let isError = false;
        let pageMeta = this.directory[pageId] || this.directory["404"];
        if (!this.directory.hasOwnProperty(pageId)) isError = true;
        
        this.pageName = pageMeta.title;

        // Update Card Content
        if (savePage == "") {
          const resp = await this.fetchData(pageMeta.path);
          
          if (resp == "Error") {
            // this.content = createContentObj(`File <span class="error">${pageId}</span> is registered in metadata.json but does not exist`);
            this.content = createContentObj(`Page <span class="error">${pageId}</span> does not exist`);
          } else {
            this.content = resp
            console.log(this.content)
            if (this.content["areas"].hasOwnProperty("full")) {
              const tabs = this.content["areas"]["full"].tabs
              if (Object.keys(tabs).length === 1) {
                const tabname = Object.keys(tabs)[0]
                if (tabs[tabname].trim() == "") {
                  this.content = createContentObj("The Page is empty");
                }
              }
            }
            
          }

          // if (isError) {
          //   this.content += `\n\nPage <span class="error">${pageId}</span> does not exist.`;
          // }

        } else {
          this.content = savePage
          console.log("this is called")
        }

        this.pageId = pageId
      
        // Update App
        this.$forceUpdate();
      },
      getCurrentPageId() {
        let pageId = (new URLSearchParams(window.location.search)).get('p');
        if (pageId == null || pageId == "") pageId = "home"
        if (!this.directory.hasOwnProperty(pageId)) pageId = "404"
        return pageId
      },
      savePage(newPage) {

        this.reload(this.getCurrentPageId(), false, newPage)
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

  app.directive("click-outside", clickOutside)
  root = mount(app) 
 

}



function setup() {
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
}

function mount(app) {
  // Mount Components
  const components = [
    breadcrumbs,
    card,
    editmenu,
    editor,
    modal,
    profilebox,
    searchbox,
    sidebar,
    sidebarbtn,
    sidebaredit,
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
      handler(value) {
        
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
    }
  },
  emits: ['processed-content'],
  props: {
    title: { type: String, default: "Ethan Morales" },
    pageId: { type: String },
    content: { type: Object },
    directory: { type: Object, required: true },
    toggleState: { type: Boolean }
  },
  components: ['BreadCrumbs'],
  watch: {
    content: {
      immediate: true,
      deep: true,
      async handler(value) {      
        // Return if value is empty
        if (isObjEmpty(value)) return  
        
        // Unnecessarily complcated preview removal.        Massive SKILL ISSUE lmao it works
        let areas = copyobj(value['areas'])
        if (areas.hasOwnProperty("preview")) {
          const length = Object.keys(areas["preview"].tabs).length
          if (length == 1) {
            const tabName = Object.keys(areas["preview"].tabs)[0]
            if (areas["preview"].tabs[tabName].trim().length == 0) {
              delete areas["preview"]
            }
          } else if (length == 0) {
            delete areas["preview"]
          }

        }

        for (const area in areas) {
          for (const tab in areas[area].tabs) {
            
            let content = areas[area].tabs[tab]

            content = content.trim()

            content = this.renderMD(content)

            content = autoLink(content, this.directory)

            areas[area].tabs[tab] = content
          }
        }
        this.areas = areas

        // Refresh
        await this.refresh()

        this.makeTOC()
        this.toggleArea()

        this.$emit('processed-content', value)
      }
    },
    toggleState: {
      handler(value) {
        
        this.toggleArea()
      }
    }
  },
  methods: {

    renderMD(value) {

      let md = value.trim().split(/\n/gm)
      let html = ``
      for (const l of md) {
        let line = l.trim()

        // if empty line
        if (line == "") {
          html += `<p>&nbsp</p>\n`
          continue
        }

        // Render Headers
        const hres = line.match(/(#+)\s/);
        if (hres) {
          const h = hres[0].length
          let btn = ``
          if (h == 2) {
            btn = `<a class="button button--toc" onclick="document.querySelector('#top').scrollIntoView();">↑</a>`
          } else {
            btn = ``
          }
          
          html += `<span class="header1">
                      <h${h} class="H${h}">${hres.input.replace(/\#/g,'').trim()}</h${h}>${btn}
                  </span>`
          continue
        }


        // Renders Bold
        const bold = [...line.matchAll(/\*\*(.*?)\*\*/g)];
        if (bold.length != 0) {
          for (const b of bold) {
            line = line.replace(b[0], `<b>${b[1]}</b>`)
          }
        }

        // Renders italic
        const italic = [...line.matchAll(/\*(.*?)\*/g)];
        if (italic.length != 0) {
          for (const i of italic) {
            line = line.replace(i[0], `<i>${i[1]}</i>`)
          }
        }


        // Renders List
        const list = line.match(/^\* /)
        if (list) {
          line = `<li>${line.replace("* ", "").trim()}</li>`
        }

        // Renders List
        const quote = line.match(/^\> /)
        if (quote) {
          line = `<blockquote>${line.replace("> ", "").trim()}</blockquote>`
        }

        // Add to page
        html += `<p>${line}</p>\n`
      }

      
      return html
    },
    loadProfile(value) {
      if (!this.hasData(value)) return [value, {}, ""];
      
      // Separate content and profile
      const parts = value.split(this.profileDivisor);
      
      const profileText = parts[1].replace(/=/g, "").trim()
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
      const tabs = document.getElementsByClassName("tab")
      
      for (const tab of tabs) {
        if (!tab.innerHTML.includes("[[toc]]")) return
        const headers = tab.querySelectorAll("h1, h2, h3, h4, h5, h6")
        let toc = ""

        for (const head of headers) {
          head.id = head.innerText.replace(" ", "-").toLowerCase()
          toc += `<a class="button button--toc ${head.tagName}" onclick="document.querySelector('#${head.id}').scrollIntoView();">${head.innerText}</a>\n`
        } 
        

        const toc_content = `<div class="toc">
                              <h1 class="toc-title">Table of Contents</h1>
                              ${toc}
                            </div>`
        document.getElementById(tab.id).innerHTML = tab.innerHTML.replace("[[toc]]", toc_content)

        
      }
    },
    // Check if There is a data for profiles inside
    hasData(value) {
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
      await Vue.nextTick()
      this.rerender = true;
    },
    isProfileExist(area) {
      if (!this.areas[area].hasOwnProperty("profile")) {
        return false
      } else {
        return Object.keys(this.areas[area].profile).length != 0
      }
    },
    toggleArea() {
      const fullArea = document.getElementById("full-area");
      const previewArea = document.getElementById("preview-area");

      if (!previewArea) {
        return
      }
      
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

      
      <div class="card">
        <h1 id="title">
          {{ title }} 
        </h1>

        <BreadCrumbs :directory="directory" :page-id="pageId"/>

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

      <!-- <div>© 2021-2023 Aeiddius. All rights reserved.</div> -->

<!--       
      <div id="side-toc">
        
      </div> -->

    </div>
  ` 
}

const editmenu = {
  name: "EditMenu",
  props: {},
  methods: {
    open() {
      document.getElementById("editor-box").classList.remove("hide")
    },
    add() {
      changePage('add-page')
      this.open()
    }
  },
  template: `
    <div id="editmode" class="hide">
      <h1 class="titles">Edit Mode</h1>
      <button class="button--edit" @click="open">Edit Page</button>
      <button class="button--edit" @click="add">Add Page</button>
      <button class="button--edit button--edit-red">Delete Page</button>
    </div>
  `
}

const editor = {
  name: "Editor",
  data() {
    return {
      pageData: {},
      pathChoices: [],

      
      // Check to see if profile is currently edited
      isCurrentProfile: false,

      // area obj
      currentArea: "",
      currentTab: "",
      currentAreaObj: {}


    }
  },
  components: ['EditorTab'],
  emits: ['save-page'],
  props: {
    directory: { type: Object, required: true }
  },
  methods: {
    start(value){
      this.pageData = copyobj(value["areas"])


      this.changeArea('full')
    },
    changeArea(area) {

      if (area == "preview" && !this.pageData.hasOwnProperty("preview")) {
        this.pageData["preview"] = {
          tabs: {
            "default": ""
          }
        }
      }

      // Set initial variables
      this.isCurrentProfile = false
      this.currentArea = area
      this.currentTab = Object.keys(this.pageData[area].tabs)[0]
      this.currentAreaObj = copyobj(this.pageData[area])

      // Set <Tabs btn active>
      for (const ar of ['full', 'preview']) {
        if (ar == area) this.getNode(`btn-${ar}`).classList.add("btn-active")
        else this.getNode(`btn-${ar}`).classList.remove("btn-active")
      }

      // Create path directory
      const paths = [];
      for (const entryId in this.directory) {
        const entry = splitStringAtLast(this.directory[entryId].path, '/')[0]
        if (!paths.includes(entry)) paths.push(entry)
      }
      this.pathChoices = paths.sort()

      // Remove active status of btn-profile
      this.getNode("btn-profile").classList.remove("btn-active")

      document.getElementById("tab-rename-input").value = this.currentTab

      // Set <textarea>
      this.refreshTextArea()
    },
    changeTab(event) {
      // Save the last area
      this.isCurrentProfile = false

      let newTab = ""
      if (event instanceof Event) {
        newTab = event.currentTarget.value
      } else {
        newTab = event
      }

      this.currentTab = newTab
      
      document.getElementById("tab-rename-input").value = newTab
      this.refreshTextArea()

      
    },
    refreshTextArea(){
      this.getNode("textarea").value = `${this.currentAreaObj.tabs[this.currentTab]}`
    },
    editProfile() {
      if (this.isCurrentProfile == false) {
        this.isCurrentProfile = true
        this.getNode("textarea").value = `${jsyaml.dump(this.currentAreaObj.profile, 'utf8')}`
        this.getNode("btn-profile").classList.add("btn-active")
      } else {
        this.isCurrentProfile = false 
        this.refreshTextArea()
        this.getNode("btn-profile").classList.remove("btn-active")
      }
    },
    saveTextArea(event) {
      if (this.isCurrentProfile == false) {
        this.pageData[this.currentArea].tabs[this.currentTab] = event.currentTarget.value
        this.currentAreaObj.tabs[this.currentTab] = event.currentTarget.value
      } else {
        const profile =  jsyaml.load(event.currentTarget.value.trim(), 'utf8')
        this.pageData[this.currentArea].profile = profile
        this.currentAreaObj.profile = profile
      }
      console.log(this.pageData)
    },
    save() {
      const tags = document.getElementById("tags-input").value  
      const parent = document.getElementById("parent-input").value
      const path = document.getElementById("input-path").value

      let newPage = {
        "areas": this.pageData,
        "tags": tags,
        "parent": parent,
        "path": path
      }


      // emits saved page
      this.$emit('save-page', newPage)
    },
    tabNew() {
      // Checks if new tab name is empty
      const tabname = this.getNode('tab-new-input').value.trim()
      if (tabname === "") return

      // Checks if tabname exists already
      const tabs = Object.keys(this.currentAreaObj.tabs)
      if (tabs.includes(tabname)) return

      // Adds new tabname
      this.pageData[this.currentArea].tabs[tabname] = ""
      
      // Refresh
      this.changeArea(this.currentArea)

      // hide new tab
      this.getNode('tab-new').classList.toggle('hide')
      
      this.getNode(`tab-new-btn`).classList.remove("btn-active")
    },
    tabRename() {
      // Checks if renamed tab is empty
      const tabname = this.getNode('tab-rename-input').value.trim()
      if (tabname === "") return

      // Checks if tabname exists already
      const tabs = Object.keys(this.currentAreaObj.tabs)
      if (tabs.includes(tabname)) return

      // Save current tab
      this.pageData[this.currentArea].tabs[tabname] = `${this.pageData[this.currentArea].tabs[this.currentTab]}`
      
      // Delete tab
      delete this.pageData[this.currentArea].tabs[this.currentTab]

      // Refresh
      this.changeArea(this.currentArea)

      // Hide rename tab
      this.getNode('tab-rename').classList.toggle('hide')

      this.getNode(`tab-rename-btn`).classList.remove("btn-active")
    },
    tabDelete() {
      // delete this.pageData

      const keys = Object.keys(this.pageData[this.currentArea].tabs).length
      if (keys == 1) return

      delete this.pageData[this.currentArea].tabs[this.currentTab]

      // Refresh
      this.changeArea(this.currentArea)
    },
    openTabbtn(id) {
      this.getNode(`tab-${id}-btn`).classList.toggle("btn-active")
      this.getNode(`tab-${id}`).classList.toggle('hide')
    },
    closeTabbtn(id) {
      this.getNode(`tab-${id}-btn`).classList.remove("btn-active")
      this.getNode(`tab-${id}`).classList.add('hide')
    },
    exit() {
      this.getNode("editor-box").classList.add("hide")
    },
    getNode(id) {
      return document.getElementById(id)
    }
  },
  template: `
  <div id="editor-box" class="editor-container hide">
    <div id="editor" class="flex">      
      <!-- Text Input Area -->
      <div class="textbox">
        <h1>Editor</h1>
        <!-- Path selector -->
        <div class="path-select flex width-100 flex-align">
            <label>Path: </label>
            <div class="width-100">
              <input type="text" name="example" list="path-choices" 
                     class="input width-100" id="input-path"
                     placeholder="/">
              <datalist id="path-choices">
                <option :value="value" v-for="(value, index) in pathChoices">
                </option>
                
              </datalist>
            </div>
        </div>
        <!-- Textarea -->
        <textarea name="background-color: white;" id="textarea"
                  placeholder="Write here..."
                  @change="saveTextArea"></textarea>      
      </div>

      <!-- Settings -->
      <div class="editor-options flex flex-c pos-relative">

        <!-- Mode buttons -->
        <span class="flex">
          <!-- <label>Mode</label> -->
          <button class="btn btn-active" id="btn-full" @click="changeArea('full')">Full</button>
          <button class="btn" id="btn-preview" @click="changeArea('preview')">Preview</button>
        </span>

        <button class="btn" @click="editProfile" id="btn-profile">Edit Profile</button>

        <!-- Select Tab -->
        <div class="tab-options flex flex-c mt-15">
          <label>Tabs</label>
          <!-- Dropdown -->
          <select id="tab-select" @change="changeTab" v-if="currentAreaObj">
              <option :value="name" v-for="(value, name) in currentAreaObj.tabs">
                {{ name }}
              </option>
          </select>

          <!-- Edit -->
          <span class="flex">
            <button class="btn" id="tab-new-btn" @click="openTabbtn('new')">New</button>
            <button class="btn" id="tab-rename-btn" @click="openTabbtn('rename')">Rename</button>
          </span>
          <button class="btn" @click="tabDelete('delete')">Delete</button>
        </div>

        <!-- Tags -->
        <div class="flex flex-c mt-15">
          <label>Tags</label>
          <input type="text" id="tags-input" class="input width-100"
                 placeholder="tagA tagB tagC">
        </div>

        <!-- Parent -->
        <div class="flex flex-c mt-15">
          <label>Parent</label>
          <input type="text" id="parent-input" class="input width-100"
                 placeholder="home">
        </div>

        <hr class="hr">
   
        <!-- Tab:New -->
        <div class="flex flex-c boxes hide" id="tab-new">
          <label>New Tab</label>
          <input type="text" id="tab-new-input" class="input width-100"
                 placeholder="home">

          <div class="flex">
            <button class="btn" @click="tabNew">Ok</button>
            <button class="btn" @click="closeTabbtn('new')">Cancel</button>
          </div>
        </div>       


        <!-- Tab:Rename -->
        <div class="flex flex-c boxes hide" id="tab-rename">
          <label>Rename Tab</label>
          <input type="text" id="tab-rename-input" class="input width-100"
                 placeholder="home">

          <div class="flex">
            <button class="btn" @click="tabRename">Ok</button>
            <button class="btn" @click="closeTabbtn('rename')">Cancel</button>
          </div>
        </div>       



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

var pages = []

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
    directory: { type: Object, required: true },
  },
  watch: {
    directory: {
      handler(value) {


        for (const entry in value) {
          const item = value[entry].title
          pages.push({name: item, pageId: entry})
        }

        const searchbox = document.getElementById("searchbox")
        searchbox.addEventListener("keydown", function(e) {
          const val = e.target.value
          const sugs = document.getElementById("suggestions")
          console.log("val: ", val)

          let suggestedList = []

          for (const entry of pages) {
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
          
        })
      }
    }
  },
  template: `
    <div class="searchbox-area">
      <input type="text" placeholder="Search.."
             class="searchbox"
             id="searchbox" onfocusout="removeSuggestions()">
      <div id="suggestions"></div>
    </div>

     
  `
}

const sidebar = {
  name: "Sidebar",
  data() {
    return {
      navs: {},
      test: "Asd",
    }
  },
  components: ['Searchbox', 'Toggle', 'Editbar'],
  computed: {
    isCurrentNav() {
      let pageId = (new URLSearchParams(window.location.search)).get('p')
      if (pageId == null || pageId == "") pageId = "home"
      // console.log(pageId)
      return pageId
      // return 'home'
    }
  },
  props: {
    projectTitle: { type: String, default: "Default" },
    projectSubtitle: { type: String, default: "Default Subtitle" },
    directory: { type: Object, required: true },
    rerender: { type: Boolean, default: true }
  },
  watch: {
    directory: {
      async handler(value) {
        const resp = await (fetch("assets/nav.md"))
        if (resp.status === 404) {
          console.log("Nav not found")
          return
        }
    
        const navs = (await resp.text()).trim().split("\n")
        let lastNav = ""
        for (const nav of navs) {
          const newnav = nav.replace(/\[\]/g, "").trim()
          if (newnav == "") continue;
          
          // if has subnav
          if (newnav.startsWith("- ")) {
            this.navs[lastNav]['subnav'][newnav] = autoLink(nav.replace(/\-\s/, ''), this.directory)
            continue
          }
          
          // if No subnav
          this.navs[newnav] = {
            main: autoLink(nav, this.directory),
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
    }
  },
  template: `
  
  <div class="sidebar" v-click-outside="hidesidebar">

    <div class="editor-bar">
      <Sidebarbtn></Sidebarbtn>
      <SidebarEdit></SidebarEdit>
    </div>  
 

    <div class="user" id="sidebarobj" style="left: 0px;">

      <EditMenu/>

      <div id="navigation">
        <button class="close" @click="closeSidebar">✕</button>
        <!-- Titles section -->
        <div class="titles">
          <h1 class="title">{{ projectTitle }}</h1>
          <h2 class="subtitle">{{ projectSubtitle }}</h2>
        </div>
        <!-- Search Box -->
        <div class="inputs">
        <Searchbox :directory="directory"/> <Toggle :projectTitle="projectTitle"/>
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

const sidebarbtn = {
  name: "Sidebarbtn",
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
            @click="openSidebar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
              <path d="M0 3C0 1.89543 0.895431 1 2 1H14C15.1046 1 16 1.89543 16 3V13C16 14.1046 15.1046 15 14 15H2C0.895431 15 0 14.1046 0 13V3ZM5 2V14H14C14.5523 14 15 13.5523 15 13V3C15 2.44772 14.5523 2 14 2H5ZM4 2H2C1.44772 2 1 2.44772 1 3V13C1 13.5523 1.44772 14 2 14H4V2Z"/>
            </svg>
    </button>
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
      this.openEditor()
    }
  },
  mounted() {
    this.nav = document.getElementById("navigation")
    this.edit = document.getElementById("editmode")
  },
  template: `
    <button class="button--sidebaredit"
            id="sidebaredit"
            @click="openEditMenu">
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 16 16">
              <path d="M8.00004 4.75421C6.20745 4.75421 4.75427 6.20739 4.75427 7.99997C4.75427 9.79256 6.20745 11.2457 8.00004 11.2457C9.79262 11.2457 11.2458 9.79256 11.2458 7.99997C11.2458 6.20739 9.79262 4.75421 8.00004 4.75421ZM5.75427 7.99997C5.75427 6.75967 6.75973 5.75421 8.00004 5.75421C9.24034 5.75421 10.2458 6.75967 10.2458 7.99997C10.2458 9.24027 9.24034 10.2457 8.00004 10.2457C6.75973 10.2457 5.75427 9.24027 5.75427 7.99997Z"/>
              <path d="M9.79647 1.34338C9.26853 -0.447793 6.73147 -0.447791 6.20353 1.34338L6.10968 1.66179C5.95246 2.19519 5.34321 2.44755 4.85487 2.18155L4.56336 2.02276C2.9235 1.12953 1.12953 2.9235 2.02276 4.56336L2.18155 4.85487C2.44755 5.34321 2.19519 5.95246 1.66179 6.10968L1.34338 6.20353C-0.447793 6.73147 -0.447791 9.26853 1.34338 9.79647L1.66179 9.89032C2.19519 10.0475 2.44755 10.6568 2.18155 11.1451L2.02276 11.4366C1.12953 13.0765 2.92349 14.8705 4.56335 13.9772L4.85487 13.8184C5.34321 13.5524 5.95246 13.8048 6.10968 14.3382L6.20353 14.6566C6.73147 16.4478 9.26853 16.4478 9.79647 14.6566L9.89032 14.3382C10.0475 13.8048 10.6568 13.5524 11.1451 13.8184L11.4366 13.9772C13.0765 14.8705 14.8705 13.0765 13.9772 11.4366L13.8184 11.1451C13.5524 10.6568 13.8048 10.0475 14.3382 9.89032L14.6566 9.79647C16.4478 9.26853 16.4478 6.73147 14.6566 6.20353L14.3382 6.10968C13.8048 5.95246 13.5524 5.34321 13.8184 4.85487L13.9772 4.56335C14.8705 2.92349 13.0765 1.12953 11.4366 2.02276L11.1451 2.18155C10.6568 2.44755 10.0475 2.19519 9.89032 1.66179L9.79647 1.34338ZM7.16273 1.6261C7.40879 0.7913 8.59121 0.791301 8.83727 1.6261L8.93112 1.94451C9.26845 3.08899 10.5757 3.63046 11.6235 3.05972L11.915 2.90094C12.6793 2.48463 13.5154 3.32074 13.0991 4.08501L12.9403 4.37653C12.3695 5.42433 12.911 6.73155 14.0555 7.06888L14.3739 7.16273C15.2087 7.40879 15.2087 8.59121 14.3739 8.83727L14.0555 8.93112C12.911 9.26845 12.3695 10.5757 12.9403 11.6235L13.0991 11.915C13.5154 12.6793 12.6793 13.5154 11.915 13.0991L11.6235 12.9403C10.5757 12.3695 9.26845 12.911 8.93112 14.0555L8.83727 14.3739C8.59121 15.2087 7.40879 15.2087 7.16273 14.3739L7.06888 14.0555C6.73155 12.911 5.42433 12.3695 4.37653 12.9403L4.08501 13.0991C3.32074 13.5154 2.48463 12.6793 2.90093 11.915L3.05972 11.6235C3.63046 10.5757 3.089 9.26845 1.94452 8.93112L1.6261 8.83727C0.7913 8.59121 0.791301 7.40879 1.6261 7.16273L1.94451 7.06888C3.08899 6.73155 3.63046 5.42433 3.05972 4.37653L2.90093 4.08501C2.48463 3.32073 3.32074 2.48463 4.08501 2.90093L4.37653 3.05972C5.42432 3.63046 6.73155 3.089 7.06888 1.94452L7.16273 1.6261Z"/>
            </svg>
    </button> 

    <button class="button--sidebaredit" @click="openEditor">
      <svg xmlns="http://www.w3.org/2000/svg" width="19" height="25" viewBox="0 0 12 16">
        <path d="M12 4.5V14C12 15.1046 11.1046 16 10 16H2C0.895431 16 0 15.1046 0 14V2C0 0.89543 0.895431 0 2 0H7.5L12 4.5ZM9 4.5C8.17157 4.5 7.5 3.82843 7.5 3V1H2C1.44772 1 1 1.44772 1 2V14C1 14.5523 1.44772 15 2 15H10C10.5523 15 11 14.5523 11 14V4.5H9Z"/>
        <path d="M6.64645 6.64645C6.84171 6.45118 7.15829 6.45118 7.35355 6.64645L9.35355 8.64645C9.54882 8.84171 9.54882 9.15829 9.35355 9.35355L7.35355 11.3536C7.15829 11.5488 6.84171 11.5488 6.64645 11.3536C6.45118 11.1583 6.45118 10.8417 6.64645 10.6464L8.29289 9L6.64645 7.35355C6.45118 7.15829 6.45118 6.84171 6.64645 6.64645Z"/>
        <path d="M5.35355 6.64645C5.15829 6.45118 4.84171 6.45118 4.64645 6.64645L2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355L4.64645 11.3536C4.84171 11.5488 5.15829 11.5488 5.35355 11.3536C5.54882 11.1583 5.54882 10.8417 5.35355 10.6464L3.70711 9L5.35355 7.35355C5.54882 7.15829 5.54882 6.84171 5.35355 6.64645Z"/>
      </svg>
    </button>

    <button class="button--sidebaredit" @click="addPage">
      <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 16 16">
        <path d="M8 6.5C8.27614 6.5 8.5 6.72386 8.5 7V8.5H10C10.2761 8.5 10.5 8.72386 10.5 9C10.5 9.27614 10.2761 9.5 10 9.5H8.5V11C8.5 11.2761 8.27614 11.5 8 11.5C7.72386 11.5 7.5 11.2761 7.5 11V9.5H6C5.72386 9.5 5.5 9.27614 5.5 9C5.5 8.72386 5.72386 8.5 6 8.5H7.5V7C7.5 6.72386 7.72386 6.5 8 6.5Z"/>
        <path d="M14 4.5V14C14 15.1046 13.1046 16 12 16H4C2.89543 16 2 15.1046 2 14V2C2 0.89543 2.89543 0 4 0H9.5L14 4.5ZM11 4.5C10.1716 4.5 9.5 3.82843 9.5 3V1H4C3.44772 1 3 1.44772 3 2V14C3 14.5523 3.44772 15 4 15H12C12.5523 15 13 14.5523 13 14V4.5H11Z"/>
      </svg>
    </button>

    
    <button class="button--sidebaredit">
      <svg xmlns="http://www.w3.org/2000/svg" width="19" height="26" viewBox="0 0 12 16">
        <path d="M4.85355 7.14645C4.65829 6.95118 4.34171 6.95118 4.14645 7.14645C3.95118 7.34171 3.95118 7.65829 4.14645 7.85355L5.29289 9L4.14645 10.1464C3.95118 10.3417 3.95118 10.6583 4.14645 10.8536C4.34171 11.0488 4.65829 11.0488 4.85355 10.8536L6 9.70711L7.14645 10.8536C7.34171 11.0488 7.65829 11.0488 7.85355 10.8536C8.04882 10.6583 8.04882 10.3417 7.85355 10.1464L6.70711 9L7.85355 7.85355C8.04882 7.65829 8.04882 7.34171 7.85355 7.14645C7.65829 6.95118 7.34171 6.95118 7.14645 7.14645L6 8.29289L4.85355 7.14645Z"/>
        <path d="M12 14V4.5L7.5 0H2C0.895431 0 0 0.89543 0 2V14C0 15.1046 0.895431 16 2 16H10C11.1046 16 12 15.1046 12 14ZM7.5 3C7.5 3.82843 8.17157 4.5 9 4.5H11V14C11 14.5523 10.5523 15 10 15H2C1.44772 15 1 14.5523 1 14V2C1 1.44772 1.44772 1 2 1H7.5V3Z"/>
      </svg>
    </button>
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

  },
  methods: {

    toggleTab(name) {
      // Make target tab appear
      const targetTab = `${name}-${this.groupclass}-content`
      const tabs = document.getElementsByClassName(this.groupclass)
      for (const tab of tabs) {
      if (tab.id == targetTab) {
          tab.classList.remove("hide")
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
    projectTitle: { type: String, required: true }
  },
  watch: {
    projectTitle: {
      handler(value) {
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
      console.log(root.toggleState)

    }
  },
  template: `
    <span class="toggle">
      <input type="checkbox" id="switch" @click="toggleArea"/>
      <label for="switch">Toggle</label>
    </span>
  `
}


