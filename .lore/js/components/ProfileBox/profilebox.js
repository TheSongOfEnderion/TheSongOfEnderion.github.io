const profilebox = {
  name: "ProfileBox",
  props: {
    profile: { type: Object }
  },
  template: `
    <div class="profilebox">
      <!-- Title -->
      <template v-if="profile.Title">
        <span class="profile--title">
          {{ profile.Title }}
        </span>
      </template>

      <!-- Image -->
      <template v-if="profile.Image">
          <Tab :tabs="profile.Image" type="image"/>      
      </template>

      <template v-if="profile.Content">
      <!-- Body  -->
        <table>
          <tbody>
          <template v-for="(category_content, category) in profile.Content">
            <!-- Category name -->
            <tr class="category" v-if="category !== 'Desc'"> 
              <td class="category--name" colspan="100%">{{ category }}</td>
            </tr>
            
            <!-- Content -->
            <template v-for="(entry_value, entry) in category_content">
            <tr>
              <td class="entry--name">{{entry}}</td>
              <td>
                 <!-- If content is a list -->
                 <template v-if="Array.isArray(entry_value)">
                  <ul class="entry--value">
                    <li v-for="(list_value, index) of entry_value" v-html="list_value"></li>      
                  </ul>
                </template>
                <!-- if content is simply a string -->
                <template v-else>
                  <span class="entry--value" v-html="entry_value"></span>
                </template>
              </td>
            </tr>
            </template>
          </template>

          </tbody>
        </table>

      </template>

    </div>
  `
}