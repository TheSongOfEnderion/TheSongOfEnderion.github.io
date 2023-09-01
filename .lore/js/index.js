
var root; //
var historyList = [];
var globalPosition = null;

function start() { 
  const app = Vue.createApp({
    data() {
      return {
        directory: {},

        // Sidebar
        projectTitle: "",
        projectSubtitle: "",
        
        // Card
        content: "",
        pageName: ""

      }
    },
    async mounted() {
      // Get Metadata
      const metadata = await (await fetch(".lore/metadata.json")).json();
      
      // Save key-info
      this.projectTitle = metadata.title;
      this.projectSubtitle = metadata.subtitle;

      // Get Directory
      this.directory = metadata.directory
      
      // Get query id
      let pageId = this.getCurrentPageId();
      if (pageId == null || pageId == "") pageId = "home"
      if (!this.directory.hasOwnProperty(pageId)) pageId = "404"

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

    },
    methods: {
      async reload(pageId, isPopState=false) {
        // Prevents repeated history when same page button is clicked
        if (isPopState == false && pageId == historyList[globalPosition]) return
        // Deal with Global Positioning
        if (globalPosition == null) globalPosition = 0
        else if(!isPopState) globalPosition += 1
        
        // Clear history before the latest new page
        if (isPopState == false && globalPosition >= 0 && globalPosition < historyList.length) {
          // console.log("before: ", isPopState, historyList, globalPosition);
          historyList.length = globalPosition
          // console.log("after: ", isPopState, historyList, globalPosition);
        }

        if (isPopState == false) historyList.push(pageId)
        // console.log("gistory: ", historyList, globalPosition, pageId)
         

        // Get metadata file 
        let isError = false
        let pageMeta = this.directory[pageId];
        if (!this.directory.hasOwnProperty(pageId)) {
          pageMeta = this.directory["404"];
          isError = true;
        }

        // Update Card Content
        this.content = await (await fetch(pageMeta.path)).text() 
        this.pageName = pageMeta.title

        if (isError == true) {
          this.content = this.content + `\n\nPage <span class="error">${pageId}</span> does not exist.`
        }
        
        // Update App
        this.$forceUpdate();
      },
      getCurrentPageId() {
        return (new URLSearchParams(window.location.search)).get('p');
      }
    }
  })

  root = mount(app)


}

function mount(app) {
  // Mount Components
  const components = [
    breadcrumbs,
    card,
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





// ==================
//     Components 
// ==================
const breadcrumbs = {
  name: "BreadCrumbs",
  template: `
  <div class="breadcrumbs">
    Story > The Birth of a Hero > Characters > Ethan Morales
  </div>
  `
}

const card = {
  name: `Card`,
  data() {
    return {
      tabs: {},
      profile: {},
      rerender: true,

      divisor: "========================================================"
    }
  },
  props: {
    title: { type: String, default: "Ethan Morales" },
    content: { type: String },
    directory: { type: Object, required: true }
  },
  components: ['BreadCrumbs'],
  computed: {
    isProfileExist() {
      return Object.keys(this.profile).length != 0;
    }
  },
  watch: {
    content: {
      immediate: true,
      async handler(value) {      
        // Return if value is empty
        if (value == '') return  

        // Content to be modified
        let content = value

        this.profile = {}
        // Extracts profile box content
        if (this.hasData(value)) {
          const rawsplit = value.split(this.divisor)
          this.profile = jsyaml.load(autoLink(rawsplit[1], this.directory), 'utf8');

          // Sets into content the half without any profile box content
          content = rawsplit[2].trim()
        }

        // Get tabs and process content
        this.tabs = this.createContent(content, this.directory)

        
        await this.refresh()

        this.fixQuote()
        this.makeTOC()
      }
    }
  },
  methods: {
    createContent(value, directory) {

      const results = {};
      if (value.includes("===")) {
        // Split text by "===", remove empty sections
        const sections = value.split("===").filter(section => section.trim() !== ""); 
      
        // Loop through sections by index, incrementing by  2 to pair headers and content
        for (let i = 0; i < sections.length; i += 2) {
          // Get the section header and convert to lowercase
          const key = sections[i].trim(); 
          // Get the section content
          const value = sections[i + 1].trim(); 
          // Assign the section header as a key and content as the corresponding value in the object
          results[key] = value; 
        }
        
        // Parse data
        for (const name in results) {
          // Convert md into html
          results[name] = marked.parse(results[name]);
          // convert custom components into html
          results[name] = autoLink(results[name], directory)

        }
      } else {
        // if there is no tabs
        results["default"] = marked.parse(value);
        results["default"] = autoLink(results["default"], directory)
      }
      return results;
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
      const equalsIndex1 = value.indexOf(this.divisor);
      const equalsIndex2 = value.lastIndexOf(this.divisor);
      
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
  },
  template: `
    <div class="card-container">
      <h1 id="title">
        {{ title }}
      </h1>
      
      <div class="card">
        <BreadCrumbs/>

        <ProfileBox :profile="profile" v-if="isProfileExist"/>

        <div id="card-content" v-if="rerender">
            <Tab :tabs="tabs"/>
        </div>

      </div>
    </div>
  ` 

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

const searchbox = {
  name: "Searchbox",
  props: {},
  template: `
    <input type="text" placeholder="Search.."
           class="searchbox">
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
  props: {
    projectTitle: { type: String, default: "Default" },
    projectSubtitle: { type: String, default: "Default Subtitle" },
    directory: { type: Object, required: true }
  },
  async mounted() {
    const resp = await (fetch("assets/nav.md"))
    if (resp.status === 404) {
      console.log("Nav not found")
      return
    }

    const navs = (await resp.text()).trim().split("\n")
    for (const nav of navs) {
      console.log(nav)
      this.navs[nav.replace(/\[\]/g, "")] = autoLink(nav, this.directory)
    }    

    console.log(this.navs)
  },
  methods: {
    closeSidebar() {
      document.getElementById("sidebarobj").style.top = "-1000px";
      document.getElementById("sidebaropen").style.display = "block";
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
    <Searchbox/> <Toggle/>
    </div>
    
    <!-- Navigation Links -->
    <div class="nav-links">
      <template v-for="(value, name, index) in navs">
        <span v-html='value' class="button--sidebar"></span> 
        <br> 
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
  props: {},
  template: `
    <span class="toggle">
      <input type="checkbox" id="switch"/>
      <label for="switch">Toggle</label>
    </span>
  `
}


