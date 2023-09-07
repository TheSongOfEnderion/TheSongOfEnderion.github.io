
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