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