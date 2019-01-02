<template>
  <v-path 
    
    :data="path"
    :config="config"></v-path>

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

  },
  beforeMount() {

  },
  methods: {
  }
}
</script>