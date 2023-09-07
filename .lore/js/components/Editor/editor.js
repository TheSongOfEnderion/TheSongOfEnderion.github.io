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


    }
  },
  components: ['EditorTab'],
  emits: ['save-page'],
  props: {
    directory: { type: Object, required: true }
  },
  methods: {
    start(value){
      this.pageData = copyobj(value)
      this.changeArea('full')
    },
    changeArea(area) {
      // Set initial variables
      this.isCurrentProfile = false
      this.currentArea = area
      this.currentTab = Object.keys(this.pageData[area].original)[0]
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
        if (!paths.includes(entry)) paths.push(entry)
      }
      this.pathChoices = paths.sort()

      // Remove active status of btn-profile
      this.getNode("btn-profile").classList.remove("btn-active")

      // Set <textarea>
      this.refreshTextArea()
    },
    changeTab(event) {
      // Save the last area
      this.isCurrentProfile = false
      const newTab = event.currentTarget.value
      this.currentTab = newTab

      this.refreshTextArea()
    },
    refreshTextArea(){
      this.getNode("textarea").value = `${this.currentAreaObj.original[this.currentTab]}`
    },
    editProfile() {
      if (this.isCurrentProfile == false) {
        this.isCurrentProfile = true
        this.getNode("textarea").value = `${this.currentAreaObj.profileOriginal}`
        this.getNode("btn-profile").classList.add("btn-active")
      } else {
        this.isCurrentProfile = false 
        this.refreshTextArea()
        this.getNode("btn-profile").classList.remove("btn-active")
      }
    },
    saveTextArea(event) {
      if (this.isCurrentProfile == false) {
        this.pageData[this.currentArea].original[this.currentTab] = event.currentTarget.value
        this.currentAreaObj.original[this.currentTab] = event.currentTarget.value
      } else {
        this.pageData[this.currentArea].profileOriginal = event.currentTarget.value
        this.currentAreaObj.profileOriginal = event.currentTarget.value
      }
    },
    save() {
      let newPage = ""
      // Check if preview is empty
      const previewKeys = Object.keys(this.pageData['preview'].original)
      const noPreview = (previewKeys.length == 1 &&
                         previewKeys[0] == 'default' &&
                         this.pageData['preview'].original['default'].trim() == "")
                         ? true : false
      
      // Process full and preview area
      for (const area of ['full', 'preview']) {

        // Checks profile
        const profile = this.pageData[area].profileOriginal.trim()
        if (profile.trim() != "") newPage += `=============================\n${profile}\n=============================\n`
        
        // Process tabs
        const tabCount = Object.keys(this.pageData[area].original).length
        for (const tabname in this.pageData[area].original) {
          const tab = this.pageData[area].original[tabname]
          
          if (tabCount === 1) newPage += `${tab}\n` 
          else newPage += `===${tabname}===\n${tab}\n\n`
        }

        // Checks if there's a preview
        if (area == 'full' && noPreview == false) newPage += '\n----------------------------------------------------------------------\n'
      } 

      // emits saved page
      this.$emit('save-page', newPage)
    },
    tabNew() {
      // Checks if new tab name is empty
      const tabname = this.getNode('tab-new-input').value.trim()
      if (tabname === "") return

      // Checks if tabname exists already
      const tabs = Object.keys(this.currentAreaObj.original)
      if (tabs.includes(tabname)) return

      // Adds new tabname
      this.pageData[this.currentArea].original[tabname] = ""
      
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
      const tabs = Object.keys(this.currentAreaObj.original)
      if (tabs.includes(tabname)) return

      // Save current tab
      this.pageData[this.currentArea].original[tabname] = `${this.pageData[this.currentArea].original[this.currentTab]}`
      
      // Delete tab
      delete this.pageData[this.currentArea].original[this.currentTab]

      // Refresh
      this.changeArea(this.currentArea)

      // Hide rename tab
      this.getNode('tab-rename').classList.toggle('hide')

      this.getNode(`tab-rename-btn`).classList.remove("btn-active")
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
    }
  },
  template: `
  <div id="editor-box" class="editor-container hide">
    <div id="editor" class="flex">      
      <!-- Text Input Area -->
      <div class="textbox">
        <h1>Editor</h1>
        <!-- Path selector -->
        <div class="path-select flex width-100 flex-align">
            <label>Path: </label>
            <div class="width-100">
              <input type="text" name="example" list="path-choices" 
                     class="input width-100"
                     placeholder="/">
              <datalist id="path-choices">
                <option :value="value" v-for="(value, index) in pathChoices">
                </option>
                
              </datalist>
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
          <button class="btn btn-active" id="btn-full" @click="changeArea('full')">Full</button>
          <button class="btn" id="btn-preview" @click="changeArea('preview')">Preview</button>
        </span>

        <button class="btn" @click="editProfile" id="btn-profile">Edit Profile</button>

        <!-- Select Tab -->
        <div class="tab-options flex flex-c mt-15">
          <label>Tabs</label>
          <!-- Dropdown -->
          <select id="tab-select" @change="changeTab" v-if="currentAreaObj">
              <option :value="name" v-for="(value, name) in currentAreaObj.original">
                {{ name }}
              </option>
          </select>

          <!-- Edit -->
          <span class="flex">
            <button class="btn" id="tab-new-btn" @click="openTabbtn('new')">New</button>
            <button class="btn" id="tab-rename-btn" @click="openTabbtn('rename')">Rename</button>
          </span>
          <button class="btn">Delete</button>
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


   
        <!-- Tab:New -->
        <div class="flex flex-c mt-15 boxes hide" id="tab-new">
          <label>New Tab</label>
          <input type="text" id="tab-new-input" class="input width-100"
                 placeholder="home">

          <div class="flex">
            <button class="btn" @click="tabNew">Ok</button>
            <button class="btn" @click="closeTabbtn('new')">Cancel</button>
          </div>
        </div>       


        <!-- Tab:Rename -->
        <div class="flex flex-c mt-15 boxes hide" id="tab-rename">
          <label>Rename Tab</label>
          <input type="text" id="tab-rename-input" class="input width-100"
                 placeholder="home">

          <div class="flex">
            <button class="btn" @click="tabRename">Ok</button>
            <button class="btn" @click="closeTabbtn('rename')">Cancel</button>
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