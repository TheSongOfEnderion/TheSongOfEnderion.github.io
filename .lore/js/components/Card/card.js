
const card = {
  name: `Card`,
  data() {
    return {
      // Card Data
      areas: {
        spoiler: {
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
      spoilerDivisor: "----------------------------------------------------------------------",
    }
  },
  props: {
    title: { type: String, default: "Ethan Morales" },
    content: { type: String },
    directory: { type: Object, required: true },
    toggleState: { type: Boolean }
  },
  components: ['BreadCrumbs'],
  watch: {
    content: {
      immediate: true,
      async handler(value) {      
        // Return if value is empty
        if (value == '') return  

        // Refresh
        this.profile = {}

        // Start
        const [spoilerContents, previewContent] = value.split(this.spoilerDivisor).slice(0, 2);

        // Checks if there is no preview
        if (previewContent == undefined) this.noPreview = true
  
        const areas = {
          'spoiler': spoilerContents.trim(), 
          'preview': previewContent == undefined ? "" : previewContent.trim()
        }

        for (const area in areas) {
          let [content, profile] = this.loadProfile(areas[area])

          this.areas[area].profile = profile
          this.areas[area].tabs = this.createContent(content, this.directory)
        }

        // Refresh
        await this.refresh()
        this.fixQuote()
        this.makeTOC()
        this.toggleArea()
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

      const results = {};
      const regex = /===(?!.*===)([^=]+)===/

      if (regex.test(value)) {
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
    loadProfile(value) {
      if (!this.hasData(value)) return [value, {}];
      
      // Separate content and profile
      const parts = value.split(this.profileDivisor);
      
      // Load yaml
      let profile = {};
      try {
        profile = jsyaml.load(autoLink(parts[1].replace(/=/g, "").trim(), this.directory), 'utf8');
      } catch (error) {
        console.log("Bad YAML Data on .md file");
        return [value, {}];
      }
      
      // Load content
      const content = parts[2].trim();
    
      return [content, profile];
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
      const spoilerArea = document.getElementById("spoiler-area");
      const previewArea = document.getElementById("preview-area");
      
      if (this.noPreview || this.toggleState) {
        spoilerArea.classList.remove("hide");
        previewArea.classList.add("hide");
      } else {
        spoilerArea.classList.add("hide");
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
        <BreadCrumbs/>

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