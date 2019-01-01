<template>
    <v-circle
      :x="x"
      :y="y"
      :config="circleData"></v-circle>

</template>

<script>

export default {
  name: 'DragCircle',
  data() {
    return {
    };
  },
  props: {
      x: Number,
      y: Number,
      circleId: Number,
      circleData: {}
  },
  computed: {

  },
  beforeMount() {

  },
  methods: {
  }
}
</script>