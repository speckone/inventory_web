import vuetify from "./vuetify";
import Vue from 'vue';

import VuetifyConfirm from 'vuetify-confirm'

Vue.use(VuetifyConfirm, {vuetify, color: 'warning', icon: 'mdi-alert', title: 'Warning',})
export default class confirm {
}