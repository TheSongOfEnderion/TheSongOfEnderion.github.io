const editorinput = {
  name: "EditorInput",
  props: {
    label: { type:String, required: true },
    iid: { type:String, required: true },
    did: { type:String },
    placeholder: { type:String},
    datalist:  { type: Array }
  },
  template: `
    <div class="flex flex-c mt-15">
      <label :for="iid">{{ label }}</label>
      <input type="text" :id="iid" class="input width-100"
             :placeholder="placeholder" :list="did">
      <template v-if="datalist">
        <datalist  datalist :id="did">
          <option :value="value" v-for="(value, index) in datalist"></option>
        </datalist>
      </template>

    </div>

  `
}