<template>
  
      <v-layer  ref="drawLayer">
        <ClosedPath 
          v-for="(p, index) in paths"
          :path="p"
          :pathId="index"
          :config="{ tension: 0.5, closed: false, stroke: 'black',
          fill: 'pink',
          fillLinearGradientStartPoint: { x: -50, y: -50 },
          fillLinearGradientEndPoint: { x: 50, y: 50 },
          fillLinearGradientColorStops: [0, 'red', 1, 'yellow']
        }"></ClosedPath>
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
     paths: Array
  },
  computed: {

  },
  beforeMount() {

  },
  methods: {
  }
}
</script>