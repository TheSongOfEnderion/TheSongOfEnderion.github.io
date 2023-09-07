const editbar = {
  name: "Editbar",
  props: {},
  methods: {
    open() {
      document.getElementById("editor-box").classList.remove("hide")
    }
  },
  template: `
    <div class="editbar">
      <h1>Edit Mode</h1>

      <div class="buttons">
        <button class="button--edit" @click="open">Edit Page</button>
        <button class="button--edit">Add Page</button>
        <button class="button--edit button--edit-red">Delete Page</button>
      </div>

      

    </div>
  `
}  