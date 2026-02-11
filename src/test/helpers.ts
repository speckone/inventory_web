import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import type { Component } from 'vue'

const vuetify = createVuetify({ components, directives })

export function mountWithPlugins(component: Component, options: Record<string, unknown> = {}) {
  const pinia = createPinia()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })

  return mount(component, {
    global: {
      plugins: [vuetify, pinia, router],
      ...(options.global as Record<string, unknown> || {}),
    },
    ...options,
  })
}
