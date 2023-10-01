const editbar = {
  name: "Editbar",
  props: {},
  methods: {
    open() {
      document.getElementById("editor-box").classList.remove("hide")
    }
  },
  template: `
    <div id="editmode" class="hide">
      <h1 class="titles">Edit Mode</h1>
      <button class="button--edit" @click="open">Edit Page</button>
      <button class="button--edit">Add Page</button>
      <button class="button--edit button--edit-red">Delete Page</button>
    </div>
  `
}  