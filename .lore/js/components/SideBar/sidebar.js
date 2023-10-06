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
      return pageId
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