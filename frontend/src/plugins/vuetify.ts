/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com
 */

import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import '../styles/layers.css'
import 'vuetify/styles'

const entrePageinas = {
  dark: true,
  colors: {
    background:           '#1A120B',
    surface:              '#2A1F14',
    'surface-dim':        '#17120D',
    'surface-bright':     '#2A1F14',
    'surface-container':  '#110C07',
    primary:              '#C9A227',
    'on-primary':         '#110C07',
    secondary:            '#9B8A75',
    'on-secondary':       '#110C07',
    'on-background':      '#E8D5B7',
    'on-surface':         '#E8D5B7',
    'on-surface-variant': '#9B8A75',
    error:                '#CF6679',
    'on-error':           '#110C07',
    success:              '#81C784',
    'on-success':         '#110C07',
    warning:              '#C9A227',
    'on-warning':         '#110C07',
    info:                 '#9B8A75',
    'on-info':            '#110C07',
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'entrePageinas',
    themes: { entrePageinas },
    utilities: false,
  },
  display: {
    mobileBreakpoint: 'md',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 840,
      lg: 1145,
      xl: 1545,
      xxl: 2138,
    },
  },
})
