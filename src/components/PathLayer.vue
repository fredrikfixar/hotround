<template>
  
      <v-layer  ref="drawLayer">
        <ClosedPath 
          v-for="(o, index) in objects"
          :path="o.path"
          :pathId="index"
          :config="pathConfig"></ClosedPath>
      </v-layer>

</template>

<script>

import ClosedPath from './ClosedPath.vue'

export default {
  name: 'PathLayer',
  components: {
    ClosedPath
  },
  data() {
    return {

    };
  },
  props: {
     objects: Array,
     pathConfig: {}
  },
  computed: {

  },
  beforeMount() {

  },
  methods: {
  }
}
</script>