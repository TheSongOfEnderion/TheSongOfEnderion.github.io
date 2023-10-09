const editorinputbox = {
  name: "EditorInputBox",
  data() {
    return {
      bid: makeid(5)
    }
  },
  props: {
    label: { type:String, required: true },
    iid: { type:String, required: true }, // Input id
    obid: { type:String, required: true }, // Open Button id
    placeholder: { type:String},
    okHandler: {type: Function, },
  },
  methods: {
    toggle() {
      document.getElementById(this.bid).classList.toggle("hide")
      document.getElementById(this.obid).classList.toggle("btn-active")
    },
    ok() {
      this.okHandler()
      this.cancel()
      this.removeBtnHighight()
    },
    cancel() {
      document.getElementById(this.bid).classList.add("hide")
      this.removeBtnHighight()
    },
    removeBtnHighight() {
      document.getElementById(this.obid).classList.remove("btn-active")
    }
  },
  template: `

  <div class="flex flex-c boxes hide" :id="bid">
    <label :for="iid">{{label}}</label>
    <input type="text" :id="iid" class="input width-100"
           :placeholder="placeholder">

    <div class="flex">
      <button type="button" class="btn" @click="ok">Ok</button>
      <button type="button" class="btn" @click="cancel">Cancel</button>
    </div>
  </div>       

  
  `
}