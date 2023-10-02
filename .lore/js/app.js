var root; //


var historyList = [];
var globalPosition = null;


function start() { 
  const app = Vue.createApp({
    data() {
      return {
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

    },
    methods: {
      async fetchData(url) {
        try {
          console.log("Working: ", NL_OS)
        } catch (error) {
          const resp = await fetch(url)
          if (resp.status === 404) {
            console.log("test")
            return "Error"
          }
          return (await resp.json())

        }

      },
      async reload(pageId, isPopState = false, savePage="") {

       
        // Prevents repeated history when the same page button is clicked
        if (savePage == "") {
          if (!isPopState && pageId === historyList[globalPosition]) return;
        }
                
        // Deal with Global Positioning
        if (globalPosition === null) globalPosition = 0;
        else if (!isPopState) globalPosition += 1;
      
        // Clear history before the latest new page
        if (!isPopState && globalPosition >= 0 && globalPosition < historyList.length) {
          historyList.length = globalPosition;
        }
      
        if (!isPopState) historyList.push(pageId);
      
        // Get metadata file
        let isError = false;
        let pageMeta = this.directory[pageId] || this.directory["404"];
        if (!this.directory.hasOwnProperty(pageId)) isError = true;
        
        this.pageName = pageMeta.title;

        // Update Card Content
        if (savePage == "") {
          const resp = await this.fetchData(pageMeta.path);
          
          if (resp == "Error") {
            // this.content = createContentObj(`File <span class="error">${pageId}</span> is registered in metadata.json but does not exist`);
            this.content = createContentObj(`Page <span class="error">${pageId}</span> does not exist`);
          } else {
            this.content = resp
            console.log(this.content)
            if (this.content["areas"].hasOwnProperty("full")) {
              const tabs = this.content["areas"]["full"].tabs
              if (Object.keys(tabs).length === 1) {
                const tabname = Object.keys(tabs)[0]
                if (tabs[tabname].trim() == "") {
                  this.content = createContentObj("The Page is empty");
                }
              }
            }
            
          }

          // if (isError) {
          //   this.content += `\n\nPage <span class="error">${pageId}</span> does not exist.`;
          // }

        } else {
          this.content = savePage
          console.log("this is called")
        }

        this.pageId = pageId
      
        // Update App
        this.$forceUpdate();
      },
      getCurrentPageId() {
        let pageId = (new URLSearchParams(window.location.search)).get('p');
        if (pageId == null || pageId == "") pageId = "home"
        if (!this.directory.hasOwnProperty(pageId)) pageId = "404"
        return pageId
      },
      savePage(newPage) {

        this.reload(this.getCurrentPageId(), false, newPage)
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
 