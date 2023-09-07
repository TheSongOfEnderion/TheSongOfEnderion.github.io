const breadcrumbs = {
  name: "BreadCrumbs",
  data() {
    return {
      crumbs: []
    }
  },
  props: {
    directory: { type: Object, required: true },
    pageId: { type: String }
  },
  watch: {
    pageId: {
      handler(value) {
        
        const parent = this.directory[this.pageId].parent 
        
        let crumbs = []
        const search = (page) => {
          if (!this.directory.hasOwnProperty(page)) return
          crumbs.unshift(page)
          
          const entry = this.directory[page].parent.trim()
          if (entry == "") return
          search(entry)
        }

        search(parent)
        
        crumbs.push(this.pageId)
        
        this.crumbs = crumbs
      }
    }
  },
  methods: {
    link(value) {
      return autoLink(`[[${value}]]`, this.directory)
      
    }
  },
  template: `
  <div class="breadcrumbs">
    <template v-for="(value, index) in crumbs">
      <span v-html="link(value)"></span>
       <template v-if="index + 1 != crumbs.length"> » </template>
    </template>
  </div>
  `
}  