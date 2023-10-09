const dropdown = {
  name: "Dropdown",
  props: {
    label: { type:String, required: true },
    sid: { type:String }, // Select id
    change: { type: Function },
    optionList: { type: Object, required: true },
    isArray: {type: Boolean, default: false}       
  },
  template: `
    <label :for="sid">{{ label }}</label>
    <!-- Dropdown -->
    <select :id="sid" @change="change" class="dropdown" :title="label">
      
      <template v-if="isArray">
        <option value="">None</option>
        <option :value="value" v-for="(value, name) in optionList">
            {{ value }}
        </option>
      </template>

      <template v-else>
        <option :value="name" v-for="(value, name) in optionList">
            {{ name }}
        </option>
      </template>
    </select>
  `
}