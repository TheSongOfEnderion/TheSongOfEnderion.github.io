const confirmbox = {
  name: "Confirmbox",
  props: {
    id: {type: String, required: true },
    message: { type: String, required: true, default: "Default Message" },
    handler: { type: Function}
  },
  methods: {
    close() {
      document.getElementById(this.id).classList.add("hide")
    },
    run() {
      this.handler()
      this.close()
    }
  },
  template: `
    <div class="confirmbox hide" :id="id">
      <div class="box">
        <p>{{ message }}</p>
        <div class="buttons">
          <button class="btn" @click="run">Confirm</button>
          <button class="btn btn-red" @click="close">Cancel</button>
        </div>
      </div>
    </div>

  `
}