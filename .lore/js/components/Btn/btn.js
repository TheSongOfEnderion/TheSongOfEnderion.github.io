const btn = {
  name: "Btn",
  props: {
    name: { type:String, required: true },
    bid: { type:String, required: false }, 
    click: { type: Function, required: false },
    isActive: { type: Boolean, required: false  }
  },
  template: `
    <button type="button"
            :class="['btn', isActive == true ? 'btn-active' : '']"
            :id="bid"
            @click="click">{{name}}</button>
  `
}