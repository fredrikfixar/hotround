<template>
  <v-layer ref="layer">
    <DragCircle
      v-for="(item, index) in draggablePoints"
      :circleId="index"
      :x="item.x"
      :y="item.y"
      :circleData="item.circleData"></DragCircle>
  </v-layer>
</template>

<script>

import DragCircle from './DragCircle.vue'


export default {
  name: 'CircleDragLayer',
  components: {
    DragCircle
  },
  data() {
    return {
    };
  },
  props: {
     draggablePoints: Array
  },
  computed: {

  },
  beforeMount() {

  },
  methods: {
    
  }
}
</script>