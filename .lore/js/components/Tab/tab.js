const tab = {
  name: "Tab",
  data() {
    return {
      groupclass: "",
      buttonclass: ""
    }
  },
  props: {
    tabs: { type: Object, required: true },
    type: { type: String, default: "text" },
    btnClass: { type: String, default: '' }
  },
  mounted(){
    this.groupclass = makeid(6)
    this.buttonclass = makeid(6)

  },
  methods: {

    toggleTab(name) {
      // Make target tab appear
      const targetTab = `${name}-${this.groupclass}-content`
      const tabs = document.getElementsByClassName(this.groupclass)
      for (const tab of tabs) {
        if (tab.id == targetTab) {
          tab.classList.remove("hide")
          continue;
        } 
        tab.classList.add("hide");
      }

      // Highlight target button
      const targetBtn = `${name}-${this.buttonclass}-button`
      const buttons = document.getElementsByClassName(this.buttonclass)
      for (const btn of buttons) {
        if (btn.id == targetBtn) {
          btn.classList.add("button--active")
          continue
        }
        btn.classList.remove("button--active")
      }
    }

  },
  template: `

      <div class="tab-buttons">
        <template v-for="(value, name, index) in tabs">
          <button v-if="Object.keys(tabs).length != 1"
                  :id="name + '-' + buttonclass + '-button'"
                  :class="['button', index == 0 ? 'button--active' : '', buttonclass, btnClass]"
                  @click="toggleTab(name)">
            {{ name }}      
          </button>
        </template>
      </div>

      <template v-for="(value, name, index) in tabs">
        <template v-if="type === 'text'">
          <div :id="name + '-' + groupclass + '-content'"
               :class="[groupclass, index == 0 ? '' : 'hide', 'tab']"
               v-html="value">
          </div>
        </template>
        <template v-if="type === 'image'">
          <img :id="name + '-' + groupclass + '-content'"
               :class="[groupclass, index == 0 ? '' : 'hide']"
               :src="value"
               :alt="name"
               class="profile--image"/>
          
        </template>
      </template>

  `
}