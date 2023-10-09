const editor = {
  name: "Editor",
  data() {
    return {
      pageData: {},
      pathChoices: [],
      isSaveAsTemplate: false,

      // Check to see if profile is currently edited
      isCurrentProfile: false,

      // area obj
      pageId: "",
      currentArea: "",
      currentTab: "",
      currentAreaObj: {}

      // if new page 
    } 
  },
  components: ['EditorTab', 'EditorInputBox', 'EditorInput', 'Btn', 'Dropdown'],
  emits: ['save-page'],
  props: { 
    metadata: { type: Object, required: true, default: {}},
    curPageId: { type: String, required: true, default: "not working fuck" },
  },
  methods: { 
    start(value){  
      // Set Variables
      this.pageId = this.curPageId;
      this.pageData = copyobj(value["areas"]);
      this.changeArea('full');


      // Create path directory
      const paths = [];
      for (const entryId in this.metadata.directory) {
        const entry = splitStringAtLast(this.metadata.directory[entryId].path, '/')[0];
        const rehashed_path = entry.replace(/\//g, "\\");
        if (!paths.includes(rehashed_path)) paths.push(rehashed_path);
      }
      this.pathChoices = paths.sort();
      
      // Check if template

      document.getElementById("saveAsTemplate").checked = isCurrentPageTemplate;


      // Create parent choices
      if (!this.metadata.directory.hasOwnProperty(this.pageId) || this.pageId === "404") {
        document.getElementById("input-page-name").value = this.pageId;
        document.getElementById("input-page-id").value = this.pageId;
        document.getElementById("input-path").value = "";
        return
      }

      // Set pagename
      
      this.setTemplate()

    },
    changeArea(area) {
      // Area validation CCheck
      if (area == "preview" && !this.pageData.hasOwnProperty("preview")) {
        this.pageData["preview"] = { tabs: { "default": "" } };
      }

      // Set initial variables
      this.isCurrentProfile = false;
      this.currentArea = area;
      this.currentTab = Object.keys(this.pageData[area].tabs)[0];
      this.currentAreaObj = copyobj(this.pageData[area]);

      // Set <Tabs btn active>
      for (const ar of ['full', 'preview']) {
        if (ar == area) this.getNode(`btn-${ar}`).classList.add("btn-active");
        else this.getNode(`btn-${ar}`).classList.remove("btn-active");
      }

      // Remove active status of btn-profile
      this.getNode("btn-profile").classList.remove("btn-active");

      document.getElementById("tab-rename-input").value = this.currentTab;

      // Set <textarea>
      this.refreshTextArea();
    },

    changeTab(event) {
      this.isCurrentProfile = false;
      this.currentTab = event instanceof Event ? event.currentTarget.value : event;
      this.getNode("tab-rename-input").value = this.currentTab;
      this.refreshTextArea();
    },

    async changeTemplate() {
      const select = document.getElementById("template-select");
      if (select.value === "") return;

      console.log("Select: ", select.value)
      const url = this.metadata.directory[select.value].path;

      const data = await fetchData(url);
      this.start(data);
    },

    refreshTextArea(){
      this.getNode("textarea").value = `${this.currentAreaObj.tabs[this.currentTab]}`;
    },

    editProfile() {
      if (this.isCurrentProfile == false) {
        this.isCurrentProfile = true;
        if (typeof jsyaml !== 'undefined') {
          this.getNode("textarea").value = `${jsyaml.dump(this.currentAreaObj.profile, 'utf8')}`;
        } else {
          this.getNode("textarea").value = `JS Yaml not loaded due to this being a web browser and not in pywebview`;
        }
        
        this.getNode("btn-profile").classList.add("btn-active");
      } else {
        this.isCurrentProfile = false;
        this.refreshTextArea();
        this.getNode("btn-profile").classList.remove("btn-active");
      }
    },

    saveTextArea(event) {
      if (this.isCurrentProfile == false) {
        this.pageData[this.currentArea].tabs[this.currentTab] = event.currentTarget.value;
        this.currentAreaObj.tabs[this.currentTab] = event.currentTarget.value;
      } else {
        const profile =  jsyaml.load(event.currentTarget.value.trim(), 'utf8');
        this.pageData[this.currentArea].profile = profile;
        this.currentAreaObj.profile = profile;
      }
    },

    save() {
      const tags = document.getElementById("input-tags").value.trim();
      const parent = document.getElementById("input-parent").value.trim();
      const path = document.getElementById("input-path").value.trim();
      const pageName = document.getElementById("input-page-name").value.trim();
      const pageId = document.getElementById("input-page-id").value.trim();

      // Validation
      if (pageName === "" || pageId === "" || path === ""){
        console.log("pageName|pageId|path are required");
        return;
      }

      // if template
      if (isCurrentPageTemplate === true) {
        if (!pageId.includes("template-")) {
          console.log("Wrong template id format. Must be \"template-name_here\"")
          return
        }
        if (!path.startsWith('templates')) {
          console.log("Wrong template path. Must start at \"templates\\id_here.json\"")
          return
        }
        if (this.pageId == "add-page") this.page = pageId
      }

      // Remves empty preview
      if (this.pageData.hasOwnProperty("preview")) {
        const tabs = this.pageData.preview.tabs;
        const tabsvalue = Object.keys(tabs);
        if (tabsvalue.length == 0 || (tabsvalue.length == 1 && tabs[tabsvalue[0]].trim() == "")) {
          delete this.pageData.preview;
        } 
      }

      // Validates path ending in "/"
      let newPath = path.replace(/\\/g, "/");
      if (!this.isLastCharSlash(newPath)) newPath = newPath + "/";

      // Creates metadata.json entry
      const metaEntry = {
        [pageId]: {
          "title": pageName,
          "path": newPath + pageId.replace(/\ /g, "-") + ".json",
          "parent": parent,
          "tags": tags,
        }
      }

      const newPage = {
        "areas": this.pageData,
        "tags": tags,
        "parent": parent,
      }
      // emits saved page
      this.$emit('save-page', path, newPage, metaEntry);

      console.log("Saved Successfully");
    },
    tabNew() {
      // Checks if new tab name is empty
      const tabname = this.getNode('tab-new-input').value.trim();
      if (tabname === "") return;

      // Checks if tabname exists already
      const tabs = Object.keys(this.currentAreaObj.tabs);
      if (tabs.includes(tabname)) return;

      // Adds new tabname
      this.pageData[this.currentArea].tabs[tabname] = "";
      
      // Refresh
      this.changeArea(this.currentArea);
    },
    tabRename() {
      // Checks if renamed tab is empty
      const tabname = this.getNode('tab-rename-input').value.trim();
      if (tabname === "") return;

      // Checks if tabname exists already
      const tabs = Object.keys(this.currentAreaObj.tabs);
      if (tabs.includes(tabname)) return;

      // Save current tab
      this.pageData[this.currentArea].tabs[tabname] = `${this.pageData[this.currentArea].tabs[this.currentTab]}`;
      
      // Delete tab
      delete this.pageData[this.currentArea].tabs[this.currentTab];

      // Refresh
      this.changeArea(this.currentArea);
    },
    tabDelete() {
      // delete this.pageData

      const keys = Object.keys(this.pageData[this.currentArea].tabs).length;
      if (keys == 1) return

      delete this.pageData[this.currentArea].tabs[this.currentTab];

      // Refresh
      this.changeArea(this.currentArea);
    },
    openTabbtn(id) {
      if (id==='new') {
        this.$refs.tabnew.toggle();
      } else if (id === 'rename') {
        this.$refs.tabrename.toggle();
      }
    },
    closeTabbtn(id) {
      this.getNode(`tab-${id}-btn`).classList.remove("btn-active");
      this.getNode(`tab-${id}`).classList.add('hide');
    },

    saveTemplate() {

      const checked = document.getElementById("saveAsTemplate").checked;

      isCurrentPageTemplate = checked;
      this.setTemplate();
    },


    setTemplate() {
      const pageId = document.getElementById("input-page-id")
      const pageName = document.getElementById("input-page-name")
      const path = document.getElementById("input-path")
      const parent = document.getElementById("input-parent")

      if (isCurrentPageTemplate && !this.metadata.templates.includes(this.pageId)) {
        pageId.value = "template-"
        pageName.value = "Template: "
        path.value = "templates/"
        parent.value = "templates"
      } else {
        pageId.value = this.pageId == "add-page" ? "" : this.pageId;
        pageName.value = this.pageId == "add-page" ? "" : this.metadata.directory[this.pageId].title;
        path.value = this.pageId == "add-page" ? "" : this.metadata.directory[this.pageId].path.replace(`${this.pageId}.json`, "").replace(/\//g, "\\");
        parent.value = this.pageId == "add-page" ? "" : this.metadata.directory[this.pageId].parent;
      }

    },

    exit() {
      this.getNode("editor-box").classList.add("hide");
    },
    getNode(id) {
      return document.getElementById(id);
    },
    oninput(e) {
      if (e.target.value.trim() == "") {
        e.target.classList.add("invalid");
        return;
      }
      if (e.target.classList.contains("invalid")) {
        e.target.classList.remove("invalid");
      }
    },

    isLastCharSlash(inputString) {
      // Get the last character of the string
      var lastChar = inputString.slice(-1);
    
      // Check if the last character is "/"
      return lastChar === "/";
    }
  },
  mounted() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const editor = document.getElementById("editor-box").classList;
        if (!editor.contains("hide")) {
          editor.add("hide");
        }
      }
  });
  },
  template: `
  <div id="editor-box" class="editor-container hide">

    <div id="editor" class="flex">      

      <div class="textbox">
        <h1>Editor</h1>
        
        <!-- Header input -->
        <div class="path-select flex width-100 flex-align">
            <div class="width-100">
              <table class="table width-100">
                <!-- Data Input -->
                <tr>
                  <td><label for="input-page-name">Name:</label></td>
                  <td><input class="input width-100" id="input-page-name" @input="(event) => oninput(event)" v-on:blur="oninput"></td>
                  <td><label for="input-page-id">Id</label></td>
                  <td><input class="input width-100" id="input-page-id" @input="(event) => oninput(event)" v-on:blur="oninput"></td>
                </tr>

                <!-- Path selector -->
                <tr>
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
        <!-- Header Input -->


        <!-- Textarea -->
        <textarea name="background-color: white;" id="textarea"
                  placeholder="Write here..."
                  @change="saveTextArea"></textarea>      
      </div>

      <!-- Settings -->
      <div class="editor-options flex flex-c pos-relative">

        <!-- Mode buttons -->
        <span class="flex">
          <Btn bid="btn-full" :is-active="true" name="Full" :click="() => changeArea('full')"/>
          <Btn bid="btn-preview" name="Preview" :click="() => changeArea('preview')"/>
        </span>

        <Btn bid="btn-profile" name="Edit Profile"
             :click="editProfile"/>

        <!-- Select Tab -->
        <div class="tab-options flex flex-c mt-15">
          <!-- Dropdown -->
          <Dropdown label="Tabs"
                    sid="tab-select"
                    :change="changeTab"
                    :option-list="currentAreaObj.tabs"
                    v-if="Object.keys(currentAreaObj).length != 0"
                    />

          <!-- Edit -->
          <span class="flex">
            <Btn bid="tab-new-btn" name="New"
                 :click="() => openTabbtn('new')"/>
                 
            <Btn bid="tab-rename-btn" name="Rename"
                 :click="() => openTabbtn('rename')"/>
          </span>
          <Btn bid="tab-delete-btn" name="Delete"
               :click="() => tabDelete('delete')"/>
        
        </div>
        <!-- Select Tab -->

        
        <!-- Tags -->
        <EditorInput label="Tags"
                     iid="input-tags"
                     placeholder="tagA tagB tagC"/>
                     
        <!-- Parent -->
        <EditorInput label="Parent"
                     iid="input-parent"
                     did="parent-choices"
                     placeholder="home"
                     :datalist="Object.keys(this.metadata.directory).sort()"/>

        <hr class="hr">
   
          <!-- Template -->
          <Dropdown label="Templates"
                    sid="template-select"
                    :option-list="this.metadata.templates"
                    :change="changeTemplate"
                    :isArray="true"
                    v-if="Object.keys(currentAreaObj).length != 0"/>

          <div class="checkbox">
            <input type="checkbox" name="saveAsTemplate" id="saveAsTemplate" @change="saveTemplate">
            <span for="saveAsTemplate">Save as Template</span>
          </div>

 
        <!-- Tab:New -->
        <EditorInputBox ref="tabnew" 
                        label="New Tab"
                        iid="tab-new-input"
                        obid="tab-new-btn"
                        placeholder="home"
                        :ok-handler="tabNew"/>        

        <!-- Tab:Rename -->
        <EditorInputBox ref="tabrename" 
                        label="Rename Tab"
                        iid="tab-rename-input"
                        obid="tab-rename-btn"
                        placeholder="home"
                        :ok-handler="tabRename"
                       />
        
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