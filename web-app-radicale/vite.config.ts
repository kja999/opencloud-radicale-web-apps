import { defineConfig } from '@opencloud-eu/extension-sdk'

export default defineConfig({
  name: 'web-app-radicale',
  federation: {
    shared: {
      'vue3-gettext': {
        requiredVersion: false,
        eager: true
      }
    }
  }
})
