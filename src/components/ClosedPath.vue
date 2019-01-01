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