const gotoPage = (pageId) => {
  document.getElementById("searchbox").value  = ''

  document.getElementById("suggestions").innerHTML = ''
  changePage(pageId)

}

const removeSuggestions = () => {
  // document.getElementById("suggestions").innerHTML = ''

}

const searchbox = {
  name: "Searchbox",
  data() {
    return {
      pages: []
    }
  },
  props: {
    directory: { type: Object, required: true, default: {}},
  },
  watch: {
    directory: {
      immediate: true,
      deep: true,
      handler(value) {
        if (isObjEmpty(value)) return

        this.pages = []

        for (const entry in value) {
          const item = value[entry].title
          this.pages.push({name: item, pageId: entry})
        }
      }
    }
  },
  methods: {
    suggest() {
      const val = document.getElementById("searchbox").value.trim()
      const sugs = document.getElementById("suggestions")

      let suggestedList = []

      for (const entry of this.pages) {
        if (entry.name.toLowerCase().includes(val.toLowerCase().trim())) {
          suggestedList.push(entry)
        }
      } 

      sugs.innerHTML = ''

      for (const item of suggestedList) {
        sugs.insertAdjacentHTML('beforeend', `
        <div class="suggestion-item" onclick="gotoPage('${item.pageId}')">
          ${item.name}
        </div>
      `);
      }
      
    }
  },
  template: `
    <div class="searchbox-area">
      <input type="text" placeholder="Search.."
             class="searchbox"
             id="searchbox" onfocusout="removeSuggestions()" @keyup="suggest">
      <div id="suggestions"></div>
    </div>

     
  `
}