var pages = []

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
    directory: { type: Object, required: true },
  },
  watch: {
    directory: {
      handler(value) {


        for (const entry in value) {
          const item = value[entry].title
          pages.push({name: item, pageId: entry})
        }

        const searchbox = document.getElementById("searchbox")
        searchbox.addEventListener("keydown", function(e) {
          const val = e.target.value
          const sugs = document.getElementById("suggestions")
          

          let suggestedList = []

          for (const entry of pages) {
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
          
        })
      }
    }
  },
  template: `
    <div class="searchbox-area">
      <input type="text" placeholder="Search.."
             class="searchbox"
             id="searchbox" onfocusout="removeSuggestions()">
      <div id="suggestions"></div>
    </div>

     
  `
}