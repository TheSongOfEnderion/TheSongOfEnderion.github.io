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