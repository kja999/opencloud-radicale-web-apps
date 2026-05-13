import {
  defineWebApplication,
  ApplicationSetupOptions,
  Extension,
  AppMenuItemExtension
} from '@opencloud-eu/web-pkg'
import { urlJoin } from '@opencloud-eu/web-client'
import '@opencloud-eu/extension-sdk/tailwind.css'
import { RouteRecordRaw } from 'vue-router'
import { computed } from 'vue'
import { initLanguage, t } from './composables/useLanguage'

export default defineWebApplication({
  setup(_args: ApplicationSetupOptions) {
    console.log('[WebRadicale] App setup called')

    initLanguage()

    const appInfo = {
      id: 'web-app-radicale',
      name: t('Web Calendar'),
      icon: 'calendar',
      color: '#3788d8'
    }

    const routes: RouteRecordRaw[] = [
      {
        path: '/calendar',
        name: 'web-radicale-calendar',
        component: () => {
          console.log('[WebRadicale] Loading CalendarView.vue')
          return import('./views/CalendarView.vue')
        },
        meta: {
          authContext: 'user',
          title: t('Calendar')
        }
      },
      {
        path: '/contacts',
        name: 'web-radicale-contacts',
        component: () => {
          console.log('[WebRadicale] Loading ContactsView.vue')
          return import('./views/ContactsView.vue')
        },
        meta: {
          authContext: 'user',
          title: t('Contacts')
        }
      }
    ]

    const extensions = ({ applicationConfig }: ApplicationSetupOptions) => {
      return computed<Extension[]>(() => {
        const menuItems: AppMenuItemExtension[] = [
          {
            id: 'app.web-app-radicale.calendar',
            type: 'appMenuItem',
            label: () => t('Calendar'),
            color: '#3788d8',
            icon: 'calendar',
            path: urlJoin(appInfo.id, 'calendar')
          },
          {
            id: 'app.web-app-radicale.contacts',
            type: 'appMenuItem',
            label: () => t('Contacts'),
            color: '#e74c3c',
            icon: 'address-book',
            path: urlJoin(appInfo.id, 'contacts')
          }
        ]
        return [...menuItems]
      })
    }

    return {
      appInfo,
      routes,
      extensions: extensions(_args)
    }
  }
})