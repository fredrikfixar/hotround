<template>
  
      <v-layer :zIndex=0 ref="drawLayer">
        <ClosedPath 
          v-for="(o, index) in objects"
          :path="o.path"
          :pathId="index"
          :config="pathConfig"
          
          :key="index">
          </ClosedPath>
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
     pathConfig: {},
  },
  computed: {

  },
  beforeMount() {

  },
  methods: {
  }
}
</script>