<template>
  <v-path 
    
    :data="computedPath"
    :config="config"
    :key="path"

    ></v-path>

</template>

<script>


export default {
  name: 'PathLayer',
  data() {
    return {

    };
  },
  props: {
     path: String,
     pathId: Number,
     config: {}
  },
  computed: {
    computedPath: function() {
      console.log(this.path)
      return this.path
    }
  },
  beforeMount() {

  },
  methods: {
  }
}
</script>