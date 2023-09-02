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
        content: "",
        pageName: ""

      }
    },
    async mounted() {
      // Get Metadata
      const metadata = await (await fetch(".lore/metadata.json")).json();
      
      // Save key-info
      this.projectTitle = metadata.title;
      this.projectSubtitle = metadata.subtitle;
      document.getElementsByTagName("title")[0].innerText = this.projectTitle;

      // Get Directory
      this.directory = metadata.directory
      
      // Get query id
      let pageId = this.getCurrentPageId();
      if (pageId == null || pageId == "") pageId = "home"
      if (!this.directory.hasOwnProperty(pageId)) pageId = "404"

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
      async reload(pageId, isPopState=false) {
        // Prevents repeated history when same page button is clicked
        if (isPopState == false && pageId == historyList[globalPosition]) return
        // Deal with Global Positioning
        if (globalPosition == null) globalPosition = 0
        else if(!isPopState) globalPosition += 1
        
        // Clear history before the latest new page
        if (isPopState == false && globalPosition >= 0 && globalPosition < historyList.length) {
          // console.log("before: ", isPopState, historyList, globalPosition);
          historyList.length = globalPosition
          // console.log("after: ", isPopState, historyList, globalPosition);
        }

        if (isPopState == false) historyList.push(pageId)
        // console.log("gistory: ", historyList, globalPosition, pageId)
         

        // Get metadata file 
        let isError = false
        let pageMeta = this.directory[pageId];
        if (!this.directory.hasOwnProperty(pageId)) {
          pageMeta = this.directory["404"];
          isError = true;
        }

        // Update Card Content
        this.content = await (await fetch(pageMeta.path)).text() 
        this.pageName = pageMeta.title

        if (isError == true) {
          this.content = this.content + `\n\nPage <span class="error">${pageId}</span> does not exist.`
        }
        
        
        // Update App
        // this.rerender = false;
        // await Vue.nextTick()
        // this.rerender = true;
        
        this.$forceUpdate();
      },
      getCurrentPageId() {
        return (new URLSearchParams(window.location.search)).get('p');
      }
    }
  })

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
}