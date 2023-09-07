
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
        content: "",
        pageName: "",
        pageId: "",

      }
    },
    async mounted() {
      // Get Metadata
      const metadata = await (await fetch(".lore/metadata.json")).json();
      
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
          const resp = await fetch(pageMeta.path);
          
        
          if (resp.status === 404) {
            this.content = `File <span class="error">${pageId}</span> is registered in metadata.json but does not exist`;
          } else {
            this.content = (await resp.text()).trim() || "The Page is empty";
          }
        
          if (isError) {
            this.content += `\n\nPage <span class="error">${pageId}</span> does not exist.`;
          }

        } else {
          this.content = savePage.trim()
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
}

function mount(app) {
  // Mount Components
  const components = [
    breadcrumbs,
    card,
    editbar,
    editor,
    modal,
    profilebox,
    searchbox,
    sidebar,
    sidebarbtn,
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
  <div class="breadcrumbs">
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
      noPreview: false,

      // Divisors
      profileDivisor: "=============================",
      fullDivisor: "----------------------------------------------------------------------",
    }
  },
  emits: ['processed-content'],
  props: {
    title: { type: String, default: "Ethan Morales" },
    pageId: { type: String },
    content: { type: String },
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
        if (value == '') return  

        // Refresh
        this.profile = {}

        // Start
        const [fullContents, previewContent] = value.split(this.fullDivisor).slice(0, 2);

        // Checks if there is no preview
        if (previewContent == undefined || previewContent.trim().length == 0 ) {
          this.noPreview = true;
        } else {
          this.noPreview = false;
        }

        const areas = {
          'full': fullContents.trim(), 
          'preview': previewContent == undefined ? "" : previewContent.trim()
        }

        for (const area in areas) {
          let [content, profile, profileOriginal] = this.loadProfile(areas[area])

          this.areas[area].profile = profile
          const [tabs, tabsOriginal] = this.createContent(content, this.directory)

          this.areas[area].tabs = tabs
          this.areas[area].original = tabsOriginal
          this.areas[area].profileOriginal = profileOriginal
        } 

        // Refresh
        await this.refresh()
        this.fixQuote()
        this.makeTOC()
        this.toggleArea()

        this.$emit('processed-content', this.areas)
      }
    },
    toggleState: {
      handler(value) {
        
        this.toggleArea()
      }
    }
  },
  methods: {
    createContent(value, directory) {

      let results = {};
      let original = {}
      const regex = /===(?!.*===)([^=]+)===/
      if (regex.test(value)) {

        let raw = value.split(/===(.+?)===/gm)
        raw.shift()
        for (let i=0; i < raw.length; i+=2) {
          const tabname = raw[i]
          const content = raw[i+1]
    
          results[tabname] = content; 
        }
        
        // Parse data
        for (const name in results) {
          // Convert md into html
          original[name] = results[name].trim()
          results[name] = results[name].replace(/\n/gm, "\n\n")
          results[name] = marked.parse(results[name]);

          // convert custom components into html
          results[name] = autoLink(results[name], directory)

          
        }
      } else {
        // if there is no tabs
        original["default"] = value.trim()
        results["default"] = marked.parse(value.replace(/\n/gm, "\n\n"));
        results["default"] = autoLink(results["default"], directory)
      }
      return [results, original];
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
          toc += `<a class="button button--toc ${head.tagName}" href="#${head.id}">${head.innerText}</a>\n`
        } 
          
        document.getElementById(tab.id).innerHTML = tab.innerHTML.replace("[[toc]]", 
        `<div class="toc">
          <h1 class="toc-title">Table of Contents</h1>
          ${toc}
        </div>`)
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

    fixQuote() {
      const blockquote = document.getElementById("card-content").getElementsByTagName("blockquote")
      if (blockquote.length != 0) {
        for (const quote of blockquote) {
          quote.innerHTML = quote.innerHTML.replace(' - ', '<br> - ')
        }
      }
    },
    async refresh() {
      this.rerender = false;
      await Vue.nextTick()
      this.rerender = true;
    },
    isProfileExist(area) {
      return Object.keys(this.areas[area].profile).length != 0
    },
    toggleArea() {
      const fullArea = document.getElementById("full-area");
      const previewArea = document.getElementById("preview-area");
      
      if (this.noPreview || this.toggleState) {
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
      <h1 id="title">
        {{ title }} 
      </h1>
      
      <div class="card">
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
    </div>
  ` 
}

const editbar = {
  name: "Editbar",
  props: {},
  methods: {
    open() {
      document.getElementById("editor-box").classList.remove("hide")
    }
  },
  template: `
    <div class="editbar">
      <h1>Edit Mode</h1>

      <div class="buttons">
        <button class="button--edit" @click="open">Edit Page</button>
        <button class="button--edit">Add Page</button>
        <button class="button--edit button--edit-red">Delete Page</button>
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
      this.pageData = copyobj(value)
      this.changeArea('full')
    },
    changeArea(area) {
      // Set initial variables
      this.isCurrentProfile = false
      this.currentArea = area
      this.currentTab = Object.keys(this.pageData[area].original)[0]
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

      // Set <textarea>
      this.refreshTextArea()
    },
    changeTab(event) {
      // Save the last area
      this.isCurrentProfile = false
      const newTab = event.currentTarget.value
      this.currentTab = newTab

      this.refreshTextArea()
    },
    refreshTextArea(){
      this.getNode("textarea").value = `${this.currentAreaObj.original[this.currentTab]}`
    },
    editProfile() {
      if (this.isCurrentProfile == false) {
        this.isCurrentProfile = true
        this.getNode("textarea").value = `${this.currentAreaObj.profileOriginal}`
        this.getNode("btn-profile").classList.add("btn-active")
      } else {
        this.isCurrentProfile = false 
        this.refreshTextArea()
        this.getNode("btn-profile").classList.remove("btn-active")
      }
    },
    saveTextArea(event) {
      if (this.isCurrentProfile == false) {
        this.pageData[this.currentArea].original[this.currentTab] = event.currentTarget.value
        this.currentAreaObj.original[this.currentTab] = event.currentTarget.value
      } else {
        this.pageData[this.currentArea].profileOriginal = event.currentTarget.value
        this.currentAreaObj.profileOriginal = event.currentTarget.value
      }
    },
    save() {
      let newPage = ""
      // Check if preview is empty
      const previewKeys = Object.keys(this.pageData['preview'].original)
      const noPreview = (previewKeys.length == 1 &&
                         previewKeys[0] == 'default' &&
                         this.pageData['preview'].original['default'].trim() == "")
                         ? true : false
      
      // Process full and preview area
      for (const area of ['full', 'preview']) {

        // Checks profile
        const profile = this.pageData[area].profileOriginal.trim()
        if (profile.trim() != "") newPage += `=============================\n${profile}\n=============================\n`
        
        // Process tabs
        const tabCount = Object.keys(this.pageData[area].original).length
        for (const tabname in this.pageData[area].original) {
          const tab = this.pageData[area].original[tabname]
          
          if (tabCount === 1) newPage += `${tab}\n` 
          else newPage += `===${tabname}===\n${tab}\n\n`
        }

        // Checks if there's a preview
        if (area == 'full' && noPreview == false) newPage += '\n----------------------------------------------------------------------\n'
      } 

      // emits saved page
      this.$emit('save-page', newPage)
    },
    tabNew() {
      // Checks if new tab name is empty
      const tabname = this.getNode('tab-new-input').value.trim()
      if (tabname === "") return

      // Checks if tabname exists already
      const tabs = Object.keys(this.currentAreaObj.original)
      if (tabs.includes(tabname)) return

      // Adds new tabname
      this.pageData[this.currentArea].original[tabname] = ""
      
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
      const tabs = Object.keys(this.currentAreaObj.original)
      if (tabs.includes(tabname)) return

      // Save current tab
      this.pageData[this.currentArea].original[tabname] = `${this.pageData[this.currentArea].original[this.currentTab]}`
      
      // Delete tab
      delete this.pageData[this.currentArea].original[this.currentTab]

      // Refresh
      this.changeArea(this.currentArea)

      // Hide rename tab
      this.getNode('tab-rename').classList.toggle('hide')

      this.getNode(`tab-rename-btn`).classList.remove("btn-active")
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
                     class="input width-100"
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
              <option :value="name" v-for="(value, name) in currentAreaObj.original">
                {{ name }}
              </option>
          </select>

          <!-- Edit -->
          <span class="flex">
            <button class="btn" id="tab-new-btn" @click="openTabbtn('new')">New</button>
            <button class="btn" id="tab-rename-btn" @click="openTabbtn('rename')">Rename</button>
          </span>
          <button class="btn">Delete</button>
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


   
        <!-- Tab:New -->
        <div class="flex flex-c mt-15 boxes hide" id="tab-new">
          <label>New Tab</label>
          <input type="text" id="tab-new-input" class="input width-100"
                 placeholder="home">

          <div class="flex">
            <button class="btn" @click="tabNew">Ok</button>
            <button class="btn" @click="closeTabbtn('new')">Cancel</button>
          </div>
        </div>       


        <!-- Tab:Rename -->
        <div class="flex flex-c mt-15 boxes hide" id="tab-rename">
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
  components: ['Searchbox', 'Toggle'],
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
    }
  },
  template: `
  <div class="sidebar" id="sidebarobj">
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
                @mouseover="expand(name + '-navid')"
                
                ></span> 
          <button v-if="Object.keys(value.subnav).length != 0"
                  class="button button--showsub" 
                  @click="toggleSubNav(name + '-navid')">
                  ✢
          </button><br> 
          
          <!-- Sub button -->
          <div v-if="Object.keys(value.subnav).length != 0"
               class="button--subnav hide-subnav"
               :id="name + '-navid'"
               @mouseleave="collapse(name + '-navid')">

            <template v-for="(valuesub, namesub, indexsub) in value.subnav">
              <span v-html="valuesub" class="button--mainnav"></span> 
              <br>
            </template>
          </div>

      </template>
    </div>

  </div>
`
}

const sidebarbtn = {
  name: "Sidebarbtn",
  props: {

  },
  methods: {
    openSidebar() {
      document.getElementById("sidebarobj").style.top = "0px";
      document.getElementById("sidebaropen").style.display = "none";
    }
  },
  template: `
    <button class="button--sidebartoggle"
            id="sidebaropen"
            @click="openSidebar">
            <slot/>
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


