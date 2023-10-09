const editmenu = {
  name: "EditMenu",
  props: {
    metadata: { type: Object, required: true, default: {}},
  },
  methods: {
    open() {
      document.getElementById("editor-box").classList.remove("hide");
    },
    add() {
      changePage('add-page');
      isCurrentPageTemplate = false
      this.open();
    },
    openDelete() {
      document.getElementById("delete-confirm").classList.remove("hide");
      console.log(document.getElementById("delete-confirm"));
    },
    async openTemplate() {
      const val = document.getElementById("template-list").value;
      console.log(val);
      
      // const data = await fetchData(`templates/${val}.json`)

      changePage(val)
    },
    deselectTemplate() {
      const elem = document.getElementById("template-list").options;
      
      for(var i = 0; i < elem.length; i++){
        elem[i].selected = false;
      }

    }
  },
  template: `
    <div id="editmode" class="hide">
      <h1 class="titles">Edit Mode</h1>

      <div class="flex gap-10">
      <Btn bid="editemenu-edit-page" class="btn--dark" name="Edit Page" :click="open"/>
      <Btn bid="editemenu-add-page" class="btn--dark" name="Add Page" :click="add"/>
      <Btn bid="editemenu-delete-page" class="btn--dark btn--red" name="Delete Page" :click="openDelete"/>   
      </div>
  

      <div class="template-list">
        <h2>Templates</h2>
        <select name="Templates"  size="6" @change="openTemplate" id="template-list" title="templates" v-click-outside="deselectTemplate">
          <template v-for="(value, index) in metadata.templates">
            <option :value="value" v-if="index != 'n/a'">{{value}}</option>  
          </template>
        </select>  
      </div>
    </div>
  `
}  