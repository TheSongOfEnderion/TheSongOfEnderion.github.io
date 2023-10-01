
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