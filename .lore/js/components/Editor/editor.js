const editor = {
  name: "Editor",
  data() {
    return {
      pageData: {},
      pathChoices: [],

      
      // Check to see if profile is currently edited
      isCurrentProfile: false,

      // area obj
      currentArea: "",
      currentTab: "",
      currentAreaObj: {}

      // if new page
    }
  },
  components: ['EditorTab'],
  emits: ['save-page'],
  props: {
    directory: { type: Object, required: true },
    pageId: { type: String, required: true, default: "not working fuck" },
  },
  methods: {
    start(value){
      this.pageData = copyobj(value["areas"])
      this.changeArea('full')

      // Set pagename:
      document.getElementById("input-page-name").value = this.pageId == "add-page" ? "" : this.directory[this.pageId].title
      document.getElementById("input-page-id").value = this.pageId == "add-page" ? "" : this.pageId
      document.getElementById("input-path").value = this.pageId == "add-page" ? "" : this.directory[this.pageId].path.replace(`${this.pageId}.json`, "").replace(/\//g, "\\")
    },
    changeArea(area) {

      if (area == "preview" && !this.pageData.hasOwnProperty("preview")) {
        this.pageData["preview"] = {
          tabs: {
            "default": ""
          }
        }
      }

      // Set initial variables
      this.isCurrentProfile = false
      this.currentArea = area
      this.currentTab = Object.keys(this.pageData[area].tabs)[0]
      this.currentAreaObj = copyobj(this.pageData[area])

      // Set <Tabs btn active>
      for (const ar of ['full', 'preview']) {
        if (ar == area) this.getNode(`btn-${ar}`).classList.add("btn-active")
        else this.getNode(`btn-${ar}`).classList.remove("btn-active")
      }

      // Create path directory
      const paths = [];
      for (const entryId in this.directory) {
        const entry = splitStringAtLast(this.directory[entryId].path, '/')[0]
        const rehashed_path = entry.replace(/\//g, "\\")
        if (!paths.includes(rehashed_path)) paths.push(rehashed_path)
      }
      this.pathChoices = paths.sort()

      // Remove active status of btn-profile
      this.getNode("btn-profile").classList.remove("btn-active")

      document.getElementById("tab-rename-input").value = this.currentTab

      // Set <textarea>
      this.refreshTextArea()
    },
    changeTab(event) {
      // Save the last area
      this.isCurrentProfile = false

      let newTab = ""
      if (event instanceof Event) {
        newTab = event.currentTarget.value
      } else {
        newTab = event
      }

      this.currentTab = newTab
      
      document.getElementById("tab-rename-input").value = newTab
      this.refreshTextArea()

      
    },
    refreshTextArea(){
      this.getNode("textarea").value = `${this.currentAreaObj.tabs[this.currentTab]}`
    },
    editProfile() {
      if (this.isCurrentProfile == false) {
        this.isCurrentProfile = true
        this.getNode("textarea").value = `${jsyaml.dump(this.currentAreaObj.profile, 'utf8')}`
        this.getNode("btn-profile").classList.add("btn-active")
      } else {
        this.isCurrentProfile = false 
        this.refreshTextArea()
        this.getNode("btn-profile").classList.remove("btn-active")
      }
    },
    saveTextArea(event) {
      if (this.isCurrentProfile == false) {
        this.pageData[this.currentArea].tabs[this.currentTab] = event.currentTarget.value
        this.currentAreaObj.tabs[this.currentTab] = event.currentTarget.value
      } else {
        const profile =  jsyaml.load(event.currentTarget.value.trim(), 'utf8')
        this.pageData[this.currentArea].profile = profile
        this.currentAreaObj.profile = profile
      }
    },
    save() {
      const tags = document.getElementById("tags-input").value.trim()
      const parent = document.getElementById("parent-input").value.trim()
      const path = document.getElementById("input-path").value.trim()
      const pageName = document.getElementById("input-page-name").value.trim()
      const pageId = document.getElementById("input-page-id").value.trim()

      // Validation
      if (pageName === "" || pageId === "" || path === ""){
        console.log("pageName|pageId|path are required")
        return
      }

      // if (pageId != this.pageId) {
      //   console.log(pageId, this.pageId)
      // }

      // Remves empty preview
      if (this.pageData.hasOwnProperty("preview")) {
        const tabs = this.pageData.preview.tabs
        const tabsvalue = Object.keys(tabs)
        if (tabsvalue.length == 0 || (tabsvalue.length == 1 && tabs[tabsvalue[0]].trim() == "")) {
          delete this.pageData.preview
        } 
      }

      // Creates metadata.json entry
      let metaEntry = {
        [pageId]: {
          "title": pageName,
          "path": path.replace(/\\/g, "/") + pageId.replace(/\ /g, "-") + ".json",
          "parent": parent,
        }
      }

      let newPage = {
        "areas": this.pageData,
        "tags": tags,
        "parent": parent,
      }

      // emits saved page
      this.$emit('save-page', newPage, metaEntry)

      if (isWebView) {
        pywebview.api.savePage(path, this.pageId, newPage, metaEntry)
      }
      console.log("Saved Successfully")
    },
    tabNew() {
      // Checks if new tab name is empty
      const tabname = this.getNode('tab-new-input').value.trim()
      if (tabname === "") return

      // Checks if tabname exists already
      const tabs = Object.keys(this.currentAreaObj.tabs)
      if (tabs.includes(tabname)) return

      // Adds new tabname
      this.pageData[this.currentArea].tabs[tabname] = ""
      
      // Refresh
      this.changeArea(this.currentArea)

      // hide new tab
      this.getNode('tab-new').classList.toggle('hide')
      
      this.getNode(`tab-new-btn`).classList.remove("btn-active")
    },
    tabRename() {
      // Checks if renamed tab is empty
      const tabname = this.getNode('tab-rename-input').value.trim()
      if (tabname === "") return

      // Checks if tabname exists already
      const tabs = Object.keys(this.currentAreaObj.tabs)
      if (tabs.includes(tabname)) return

      // Save current tab
      this.pageData[this.currentArea].tabs[tabname] = `${this.pageData[this.currentArea].tabs[this.currentTab]}`
      
      // Delete tab
      delete this.pageData[this.currentArea].tabs[this.currentTab]

      // Refresh
      this.changeArea(this.currentArea)

      // Hide rename tab
      this.getNode('tab-rename').classList.toggle('hide')

      this.getNode(`tab-rename-btn`).classList.remove("btn-active")
    },
    tabDelete() {
      // delete this.pageData

      const keys = Object.keys(this.pageData[this.currentArea].tabs).length
      if (keys == 1) return

      delete this.pageData[this.currentArea].tabs[this.currentTab]

      // Refresh
      this.changeArea(this.currentArea)
    },
    openTabbtn(id) {
      this.getNode(`tab-${id}-btn`).classList.toggle("btn-active")
      this.getNode(`tab-${id}`).classList.toggle('hide')
    },
    closeTabbtn(id) {
      this.getNode(`tab-${id}-btn`).classList.remove("btn-active")
      this.getNode(`tab-${id}`).classList.add('hide')
    },
    exit() {
      this.getNode("editor-box").classList.add("hide")
    },
    getNode(id) {
      return document.getElementById(id)
    },
    oninput(e) {
      if (e.target.value.trim() == "") {
        e.target.classList.add("invalid")
        return
      }
      if (e.target.classList.contains("invalid")) {
        e.target.classList.remove("invalid")
      }
    }
  },
  template: `
  <div id="editor-box" class="editor-container hide">
    <div id="editor" class="flex">      
      <!-- Text Input Area -->
      <div class="textbox">
        <h1>Editor</h1>
        

        <div class="path-select flex width-100 flex-align">

            <div class="width-100">
              <table class="table width-100">
                <tr>
                  <td><label for="input-papge-name">Name:</label></td>
                  <td><input class="input width-100" id="input-page-name" @input="(event) => oninput(event)" v-on:blur="oninput"></td>
                  <td><label for="input-page-id">Id</label></td>
                  <td><input class="input width-100" id="input-page-id" @input="(event) => oninput(event)" v-on:blur="oninput"></td>
                </tr>

                <!-- Path selector -->
                <tr  >
                  <td class="category"><label for="input-path">Path</label>:</td>
                  <td colspan="100%">
                    <input type="text" name="editor" list="path-choices" 
                       class="input width-100" id="input-path"
                       placeholder=""  @input="(event) => oninput(event)" v-on:blur="oninput">
                    <datalist id="path-choices">
                      <option :value="value" v-for="(value, index) in pathChoices">
                      </option>
                      
                    </datalist>
                  </td>
                </tr>
              </table>


            </div>
        </div>
        <!-- Textarea -->
        <textarea name="background-color: white;" id="textarea"
                  placeholder="Write here..."
                  @change="saveTextArea"></textarea>      
      </div>

      <!-- Settings -->
      <div class="editor-options flex flex-c pos-relative">

        <!-- Mode buttons -->
        <span class="flex">
          <!-- <label>Mode</label> -->
          <button class="btn btn-active" id="btn-full" @click="changeArea('full')" type="button" >Full</button>
          <button class="btn" id="btn-preview" @click="changeArea('preview')" type="button" >Preview</button>
        </span>

        <button type="button" class="btn" @click="editProfile" id="btn-profile">Edit Profile</button>

        <!-- Select Tab -->
        <div class="tab-options flex flex-c mt-15">
          <label>Tabs</label>
          <!-- Dropdown -->
          <select id="tab-select" @change="changeTab" v-if="currentAreaObj">
              <option :value="name" v-for="(value, name) in currentAreaObj.tabs">
                {{ name }}
              </option>
          </select>

          <!-- Edit -->
          <span class="flex">
            <button type="button" class="btn" id="tab-new-btn" @click="openTabbtn('new')">New</button>
            <button type="button" class="btn" id="tab-rename-btn" @click="openTabbtn('rename')">Rename</button>
          </span>
          <button type="button" class="btn" @click="tabDelete('delete')">Delete</button>
        </div>

        <!-- Tags -->
        <div class="flex flex-c mt-15">
          <label>Tags</label>
          <input type="text" id="tags-input" class="input width-100"
                 placeholder="tagA tagB tagC">
        </div>

        <!-- Parent -->
        <div class="flex flex-c mt-15">
          <label>Parent</label>
          <input type="text" id="parent-input" class="input width-100"
                 placeholder="home">
        </div>

        <hr class="hr">
   
        <!-- Tab:New -->
        <div class="flex flex-c boxes hide" id="tab-new">
          <label>New Tab</label>
          <input type="text" id="tab-new-input" class="input width-100"
                 placeholder="home">

          <div class="flex">
            <button type="button" class="btn" @click="tabNew">Ok</button>
            <button type="button" class="btn" @click="closeTabbtn('new')">Cancel</button>
          </div>
        </div>       


        <!-- Tab:Rename -->
        <div class="flex flex-c boxes hide" id="tab-rename">
          <label>Rename Tab</label>
          <input type="text" id="tab-rename-input" class="input width-100"
                 placeholder="home">

          <div class="flex">
            <button type="button" class="btn" @click="tabRename">Ok</button>
            <button type="button" class="btn" @click="closeTabbtn('rename')">Cancel</button>
          </div>
        </div>       



        <div class="flex float-bottom width-100">
          <button class="btn btn-green" @click="save">Save</button>
          <button class="btn btn-red" @click="exit">Exit</button>
        </div>
      </div>
      <!-- Settings -->
    
    </div> 

  </div>
  `
} 