import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import VueKonva from 'vue-konva'
import { createProvider } from './vue-apollo'


Vue.config.productionTip = false

Vue.use(VueKonva)

new Vue({
  apolloProvider: createProvider(),
  render: h => h(App)
}).$mount('#app')
