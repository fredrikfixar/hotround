<template>
  <v-app>
    <v-toolbar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>Hotround </span>
        <span class="font-weight-light">scoring and courses</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        flat
        href="https://github.com/vuetifyjs/vuetify/releases/latest"
        target="_blank"
      >
        <span class="mr-2">Latest Release</span>
      </v-btn>
    </v-toolbar>

    <v-content>
      <KonvaCurveTest/>
    </v-content>
  </v-app>
</template>

<script>
import KonvaCurveTest from './components/KonvaCurveTest'

export default {
  name: 'App',
  components: {
    KonvaCurveTest
  },
  data () {
    return {
      //
    }
  }
}
</script>
