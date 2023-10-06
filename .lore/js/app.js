var root; //


var historyList = [];
var globalPosition = null;
var isWebView = false

class Metadata {
  constructor(metadata) {
    this.metadata = metadata

    this.directory = this.metadata.directory
    this.projectTitle = this.metadata.title;
    this.projectSubtitle = this.metadata.subtitle;
  }
  
  updateDirKey(oldKey, newKey, value) {
    if (oldKey !== newKey) {
      delete this.metadata.directory[oldKey]
    }
    this.metadata.directory[newKey] = value[newKey]
  }
}

function start() { 
  const app = Vue.createApp({
    data() {
      return {
        metadata: {},
        directory: {},
        rerender: true,
        toggleState: false,

        // Sidebar
        projectTitle: "",
        projectSubtitle: "",
        
        // Card
        content: {},
        pageName: "",
        pageId: "",

      }
    },
    async mounted() {
      // Get Metadata
      
      const metadata = await this.fetchData(".lore/metadata.json")
      this.metadata = new Metadata(metadata)
      // console.log(this.metadata)  

      // Save key-info
      this.projectTitle = metadata.title;
      this.projectSubtitle = metadata.subtitle;
      document.getElementsByTagName("title")[0].innerText = this.projectTitle;

      // Get Directory
      this.directory = metadata.directory
      
      // Get query id
      let pageId = this.getCurrentPageId();

      // Loads page
      this.reload(pageId)

      // Setup forward and backward handler using johanholmerin's code
      window.addEventListener('forward', event => {
        if (globalPosition+1 < historyList.length) globalPosition++
        this.reload(historyList[globalPosition], true)
        console.log(event)
      });

      window.addEventListener('back', event => {
        if (globalPosition !== 0) globalPosition--
        this.reload(historyList[globalPosition], true)
        console.log(event)
      });

      setup()

      console.log("Is Web view: ", isWebView)
    },
    methods: {
      async fetchData(url) {

        const resp = await fetch(url)
        if (resp.status === 404) {
          return "Error"
        }
        return await resp.json()
      },
      /**
       * Reloads the page card component
       * @param  {string} pageId id of the page to reload from directory
       * @param  {bool}   isPopState controls the history list
       * @return {none}  Returns nothing
       */
      async reload(pageId, isPopState = false, savePage="") {

        // Prevents repeated history when the same page button is clicked
        if (savePage == "") {
          if (!isPopState && pageId === historyList[globalPosition]) return;
        }
        
        // Manipulate history back and forward
        this.history(pageId, isPopState)

        // Get metadata file
        let isError = false;
        let pageMeta = this.directory[pageId] || this.directory["404"];
        if (!this.directory.hasOwnProperty(pageId)) isError = true;
        
        // Update Card Content        
        if (savePage != "") {
          // An editor reload
          this.content = savePage
        } else {
          // A new page get
          const resp = await this.fetchData(pageMeta.path);
          if (resp == "Error") {
            // Page is in Metadata.json but doesn't exist
            this.content = createContentObj("The page exist in <span class=\"error\">metadata.json</span> but does not exit")
          } else {
            // Check if page is real or Page does not exist
            if (pageId == "404") resp.areas.full.tabs.default = resp.areas.full.tabs.default.replace("[[page-id]]", `<span class="error">${this.getCurrentPageId(true)}</span>`)
            this.content = this.isContentEmpty(resp)
          }
        }

        // Update App
        this.pageId = pageId
        this.$forceUpdate();
        this.pageName = pageMeta.title;   // Places here so it updates with the content at the same time
      },
        /**
       * Reloads the page card component
       * @param  {string} pageId id of the page to reload from directory
       * @param  {bool}   isPopState controls the history list
       * @return {none}  Returns nothing
       */
      history(pageId, isPopState) {
        // Deal with Global Positioning
        if (globalPosition === null) globalPosition = 0;
        else if (!isPopState) globalPosition += 1;
      
        // Clear history before the latest new page
        if (!isPopState && globalPosition >= 0 && globalPosition < historyList.length) {
          historyList.length = globalPosition;
        }
      
        if (!isPopState) historyList.push(pageId);
      },

      /**
       * Checks if the content json is empty
       * @param  {Object} contentObj json object GET from files
       * @return {Object}  the same object or an empty obj
       */
      isContentEmpty(contentObj) {
        if (contentObj["areas"].hasOwnProperty("full")) {
          const tabs = contentObj["areas"]["full"].tabs
          if (Object.keys(tabs).length === 1) {
            const tabname = Object.keys(tabs)[0]
            if (tabs[tabname].trim() == "") {
              return createContentObj("The Page is empty");
            }
          }
        }
        return contentObj
      },
      getCurrentPageId(real=false) {
        let pageId = (new URLSearchParams(window.location.search)).get('p');
        if (real) {
          return pageId
        }
        if (pageId == null || pageId == "") pageId = "home"
        if (!this.directory.hasOwnProperty(pageId)) pageId = "404"
        return pageId
      },
      savePage(newPage, metaEntry) {
        const key = Object.keys(metaEntry)[0]

        this.directory[key] = metaEntry[key]
        if (key !== this.pageId) {
          delete this.directory[this.pageId]
          console.log(this.directory)
          this.pageId = key
          const url = new URL(window.location);  
          url.searchParams.set("p", this.pageId);
          history.replaceState(null, null, ' ');
          history.pushState({}, "", url);
        }
        
        this.reload(this.pageId, false, newPage)
        console.log(this.pageId)
      }
    }
  })

  // https://stackoverflow.com/questions/36170425/detect-click-outside-element
  const clickOutside = {
    beforeMount: (el, binding) => {
      el.clickOutsideEvent = event => {
        // here I check that click was outside the el and his children
        if (!(el == event.target || el.contains(event.target))) {
          // and if it did, call method provided in attribute value
          binding.value();
        }
      };
      document.addEventListener("click", el.clickOutsideEvent);
    },
    unmounted: el => {
      document.removeEventListener("click", el.clickOutsideEvent);
    },
  };

  app.directive("click-outside", clickOutside)
  root = mount(app) 
 

}



function setup() {
  window.addEventListener('pywebviewready',()=>   {
    isWebView = true
  })

  // source: https://css-tricks.com/snippets/jquery/smooth-scrolling/
  window.scroll({
    top: 2500, 
    left: 0, 
    behavior: 'smooth'
  });
  
  // Scroll certain amounts from current position 
  window.scrollBy({ 
    top: 100, // could be negative value
    left: 0, 
    behavior: 'smooth' 
  });

  const clickOutside = {
  beforeMount: (el, binding) => {
    el.clickOutsideEvent = event => {
      // here I check that click was outside the el and his children
      if (!(el == event.target || el.contains(event.target))) {
        // and if it did, call method provided in attribute value
        binding.value();
      }
    };
    document.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted: el => {
    document.removeEventListener("click", el.clickOutsideEvent);
  },
};  
}
 