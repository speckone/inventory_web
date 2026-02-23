import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'essoLight',
    themes: {
      essoLight: {
        dark: false,
        colors: {
          primary: '#6D4C41',
          secondary: '#FF8F00',
          accent: '#D7CCC8',
          background: '#FAFAFA',
          surface: '#FFFFFF',
          error: '#D32F2F',
          warning: '#F57C00',
          success: '#388E3C',
          info: '#1976D2',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
        },
      },
    },
  },
  defaults: {
    VCard: { elevation: 1, rounded: 'lg' },
    VBtn: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
    VDataTable: { density: 'comfortable' },
  },
})
