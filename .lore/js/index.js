
var root;

function start() {
  const app = Vue.createApp({
    data() {
      return {
        directory: {},

        // Card
        content: "",
        pageName: ""

      }
    },
    async mounted() {
      // Get Metadata
      const metadata = await (await fetch(".lore/metadata.json")).json()
      
      // Get Directory
      this.directory = metadata.directory
      
      // Get query id
      let pageId = (new URLSearchParams(window.location.search)).get('p');
      if (pageId == null || pageId == "") pageId = "home"
      if (!this.directory.hasOwnProperty(pageId)) pageId = "404"

      const pageMeta = this.directory[pageId];

      this.reload(pageMeta.path, pageId, pageMeta.title)


    },
    methods: {
      async reload(path, id, name) {
        const pageFile = await (await fetch(path)).text()

        this.content = pageFile 
        this.pageName = name

        if (id == "404") {
          const pageId = (new URLSearchParams(window.location.search)).get('p');
          this.content = this.content + `\n\nPage <span class="error">${pageId}</span> does not exist.`
        }

        this.$forceUpdate();
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

function changePage(name, id, path) {
  const url = new URL(window.location);
  
  url.searchParams.set("p", id.replace(" ", "-").toLowerCase());
  history.pushState({}, "", url);

  console.log(name, path)

  // Reload vue page
  root.reload(path, "404", name)
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
          console.log(head.tagName)
          toc += `<a class="button button--toc ${head.tagName}" href="#${head.id}">${head.innerText}</a>\n`
        } 

        document.getElementById(tab.id).innerHTML = tab.innerHTML.replace("[[toc]]", 
        `<div class="toc">
          <h1 class="toc-title">Table of Contents</h1>
          ${toc}
        </div>
        `)



         
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
  template: ``
}


