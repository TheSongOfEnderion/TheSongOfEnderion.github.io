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
            this.navs[lastNav]['subnav'][newnav] = autoLink(nav, this.directory)
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
      document.getElementById(navid).classList.toggle("hide")
    },
    getNameClean(name) {
      return name.replace(/\[/g, "").replace(/\]/g, "").trim().toLowerCase()
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
                :class="['button--mainnav', isCurrentNav== getNameClean(name) ? 'button--active' : '']"></span> 
          <button v-if="Object.keys(value.subnav).length != 0"
                  class="button button--showsub" 
                  @click="toggleSubNav(name + '-navid')">
                  ✢
          </button><br> 
          
          <!-- Sub button -->
          <div v-if="Object.keys(value.subnav).length != 0"
               class="button--subnav hide"
               :id="name + '-navid'">

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