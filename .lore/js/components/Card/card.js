
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