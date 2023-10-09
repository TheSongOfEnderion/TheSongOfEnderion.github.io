const spoilerwarning = {
  name: "SpoilerWarning",
  props: {
    toggleState: { type: Boolean, required: true },
    noPreview: { type: Boolean, required: true },
  }, 
  template: `
    <div class="warning" v-if="noPreview == false">


        <span v-if="toggleState == true" class="content spoiler">
          Spoiler Mode
        </span>
        <span v-if="toggleState == false"  class="content">
          Preview Mode
        </span>

    </div>
  `
}