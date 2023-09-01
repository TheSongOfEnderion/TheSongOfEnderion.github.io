const sidebarbtn = {
  name: "Sidebarbtn",
  props: {

  },
  methods: {
    openSidebar() {
      document.getElementById("sidebarobj").style.top = "0px";
      document.getElementById("sidebaropen").style.display = "none";
    }
  },
  template: `
    <button class="button--sidebartoggle"
            id="sidebaropen"
            @click="openSidebar">
            <slot/>
    </button>
  `
}