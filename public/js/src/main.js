import Vue from 'vue';
import App from './App.vue';

window.Vue = Vue;

Vue.config.productionTip = false;

Vue.directive('visible', function (el, binding) {
  el.style.visibility = !!binding.value ? 'visible' : 'hidden';
});

new Vue({
  render: (h) => h(App),
}).$mount('#app');
