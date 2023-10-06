const toggle = {
  name: "Toggle",
  data() {
    return {
      uniqueId: ""
    }
  },
  props: {
    projectTitle: { type: String, required: true }
  },
  watch: {
    projectTitle: {
      handler(value) {
        this.uniqueId = this.projectTitle.toLowerCase().trim().replace(/\s/g, "-")+"-storage"

        if (localStorage.getItem(this.uniqueId) === null) {
          localStorage.setItem(this.uniqueId, "false");
        } 
        // localStorage.setItem(this.uniqueId, "false");
        const toggleState = localStorage.getItem(this.uniqueId)
        document.getElementById("switch").checked = toggleState === "true" ? true : false

        root.toggleState = document.getElementById("switch").checked
        
      }
    }
  },
  methods: {
    toggleArea() {
      const toggleState = document.getElementById("switch").checked
      localStorage.setItem(this.uniqueId, toggleState);
      root.toggleState = toggleState
    }
  },
  template: `
    <span class="toggle">
      <input type="checkbox" id="switch" @click="toggleArea"/>
      <label for="switch">Toggle</label>
    </span>
  `
}