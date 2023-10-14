var root; //


var historyList = [];
var globalPosition = null;
var isWebView = false;
var isCurrentPageTemplate = false;

var productionMode = false

var globalStorage = {}

class Metadata {
  constructor(metadata) {
    this.metadata = metadata;

    this.directory = this.metadata.directory;
    this.templates = this.metadata.templates;
    this.projectTitle = this.metadata.title;
    this.projectSubtitle = this.metadata.subtitle;

    // Set Metadata
    document.getElementsByTagName("title")[0].innerText = this.projectTitle;
  }

  updateDirKey(oldKey, newKey, metaEntry) {
    if (oldKey !== newKey) {
      delete this.metadata.directory[oldKey];
    }
    this.metadata.directory[newKey] = metaEntry[newKey];
    this.directory = this.metadata.directory
    this.updateLink(newKey);
  }

  deleteDirkey(key) {
    delete this.metadata.directory[key];
  }

  updateLink(newKey) {
    const url = new URL(window.location);
    url.searchParams.set("p", newKey);
    history.replaceState(null, null, ' ');
    history.pushState({}, "", url);
  }

  updateTemplate(oldKey, newKey) {
    

    if (this.metadata.templates.includes(oldKey)) {
      const index = this.metadata.templates.indexOf(oldKey);
      this.metadata.templates[index] = newKey
    } else {
      this.metadata.templates.push(newKey)
    }

    
  }
}

function start() {
  const app = Vue.createApp({
    data() {
      return {
        metadata: { directory: {} },
        directory: {},
        rerender: true,
        toggleState: false,

        // Card
        content: {},
        pageName: "",
        pageId: "",

      }
    },
    async mounted() {

      if (isWebView == true) {
        let script = document.createElement('script')
        script.src = ".lore/js/import/yaml.min.js"
        script.async = true
        document.body.appendChild(script)
      }

      // Get Metadata
      const metadata = await fetchData(".lore/metadata.json");
      this.metadata = new Metadata(metadata);

      // Get Directory
      this.directory = metadata.directory;

      // Get query id
      let pageId = this.getCurrentPageId();

      // Loads page
      this.reload(pageId);

      // Setup forward and backward handler using johanholmerin's code
      window.addEventListener('forward', event => {
        if (globalPosition + 1 < historyList.length) globalPosition++;
        this.reload(historyList[globalPosition], true);
      });

      window.addEventListener('back', event => {
        if (globalPosition !== 0) globalPosition--;
        this.reload(historyList[globalPosition], true);
      });

      setup();
    },
    methods: {

      /**
       * Reloads the page card component
       * @param  {string} pageId id of the page to reload from directory
       * @param  {bool}   isPopState controls the history list
       * @return {none}  Returns nothing
       */
      async reload(pageId, isPopState = false, savePage = "") {

        // Prevents repeated history when the same page button is clicked
        if (savePage == "") {
          if (!isPopState && pageId === historyList[globalPosition]) return;
        }

        // Manipulate history back and forward
        this.history(pageId, isPopState);

        // Get metadata file
        let pageMeta = this.directory[pageId] || this.directory["404"];

        // Update Card Content        
        if (savePage != "") {
          // An editor reload
          this.content = savePage;
        } else {
          // A new page get
          let resp = ""
          if (isWebView == false) {
            if (globalStorage.hasOwnProperty(pageId)) {
              resp = globalStorage[pageId]
            } else {
              resp = await fetchData(pageMeta.path);
              globalStorage[pageId] = resp;
            }
          } else {
            resp = await fetchData(pageMeta.path);
          }
          
          console.log(globalStorage)

          

          if (resp == "Error") {
            // Page is in Metadata.json but doesn't exist
            this.content = createContentObj("The page exist in <span class=\"error\">metadata.json</span> but does not exit");
          } else {
            // Check if page is real or Page does not exist
            if (pageId == "404" || !this.directory.hasOwnProperty(pageId)) {
              pageId = this.getCurrentPageId(true);
              resp.areas.full.tabs.default = resp.areas.full.tabs.default.replace("[[page-id]]", `<span class="error">${pageId}</span>`);
            }
            this.content = this.isContentEmpty(resp);
          }
        }
        
        isCurrentPageTemplate = this.metadata.templates.includes(pageId) ? true : false;

        // Update App
        this.pageId = pageId;
        this.$forceUpdate();
        this.pageName = pageMeta.title;   // Places here so it updates with the content at the same time
        

        const side = document.getElementById("history-content")
        let sidehtml = ``
        let prev = ''
        for (let i = historyList.length - 1; i >= 0; i--) {
          const page = historyList[i];
          if (page === prev) continue;
          if (!this.metadata.directory.hasOwnProperty(page)) continue
          sidehtml += `<a class="button button--toc H1" onclick="changePage('${page}')">${this.metadata.directory[page].title}</a>`
          prev = page;
        }
        side.innerHTML = sidehtml
        

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
          const tabs = contentObj["areas"]["full"].tabs;
          if (Object.keys(tabs).length === 1) {
            const tabname = Object.keys(tabs)[0];
            if (tabs[tabname].trim() == "") {
              return createContentObj("The Page is empty");
            }
          }
        }
        return contentObj;
      },
      getCurrentPageId(real = false) {
        let pageId = (new URLSearchParams(window.location.search)).get('p');
        if (real) {
          return pageId;
        }
        if (pageId == null || pageId == "") pageId = "home";
        if (!this.directory.hasOwnProperty(pageId)) pageId = "404";
        return pageId;
      },
      savePage(path, newPage, metaEntry) {
        const key = getKey(metaEntry)[0];
        this.metadata.updateDirKey(this.pageId, key, metaEntry);

        if (isCurrentPageTemplate == true) {
          this.metadata.updateTemplate(this.pageId, key)
          this.pageId = key;
        }
        if (isWebView == true) {
          pywebview.api.savePage(this.pageId, newPage, metaEntry, isCurrentPageTemplate);
        }
        this.pageId = key;
        this.reload(this.pageId, false, newPage);
      },
      deletePage() {
        this.metadata.deleteDirkey(this.pageId);
        changePage("home");

        if (isWebView) {
          pywebview.api.deletePage(this.pageId);
        }
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

  app.directive("click-outside", clickOutside);
  root = mount(app);


}

function loadYaml() {
  let script = document.createElement('script')
  script.src = ".lore/js/import/yaml.min.js"
  script.async = true
  document.body.appendChild(script)
}


function setup() {
  window.addEventListener('pywebviewready', () => {
    isWebView = true;
    loadYaml();

  });

  // Checks for reload during webview load
  if (typeof window.pywebview !== 'undefined') {
    isWebView = true;
    loadYaml();
  }

  console.log("Is Web view: ", isWebView)
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
}
