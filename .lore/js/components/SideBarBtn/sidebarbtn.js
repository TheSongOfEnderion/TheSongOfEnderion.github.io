const sidebarbtn = {
  name: "Sidebarbtn",
  data() {
    return {
      pos: "",
      card: "",
      lastWidth: 0,
      checked: false,
    }
  },
  methods: {
    openSidebar() {
      
      if (this.pos.style.left == "0px") {
        this.sideClose()
      } else {
        this.pos.style.left = "0px"
        if (window.innerWidth > 700) this.card.style.marginLeft = "calc(300px - 70px)"
      }

    },
    sideOpen() {
      this.pos.style.left = "0px"
      this.card.style.marginLeft = "calc(300px - 70px)"
    },
    sideClose() {
      this.pos.style.left = "-500px" 
      this.card.style.marginLeft = "0px"
    },
    isOpen() {
      return this.pos.style.left == "0px"
    },
    getElements() {
      this.pos = document.getElementById("sidebarobj")
      this.card = document.getElementsByClassName("card")[0]
    }
  },
  mounted() {
    this.getElements();
    window.addEventListener('resize', ()=> {
      
      // Negative - Openig to the right
      if (this.lastWidth - window.innerWidth < 0) {
        // if (this.isOpen() == true) {

        //   return
        // }
        
        // Positive - Closing to the left
      } else if (this.lastWidth - window.innerWidth > 0) {
        if (this.isOpen() == false) return
      }

      this.lastWidth = window.innerWidth

      if (window.innerWidth > 700) {
        // Open
        this.sideOpen()
      } else {
        // Close
        this.sideClose()
      }
    });
  },
  template: `
    <button class="button--sidebartoggle"
            id="sidebaropen"
            @click="openSidebar">
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 16 16">
              <path d="M0 3C0 1.89543 0.895431 1 2 1H14C15.1046 1 16 1.89543 16 3V13C16 14.1046 15.1046 15 14 15H2C0.895431 15 0 14.1046 0 13V3ZM5 2V14H14C14.5523 14 15 13.5523 15 13V3C15 2.44772 14.5523 2 14 2H5ZM4 2H2C1.44772 2 1 2.44772 1 3V13C1 13.5523 1.44772 14 2 14H4V2Z"/>
            </svg>
    </button>
  `
} 