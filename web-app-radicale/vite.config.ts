import { defineConfig } from '@opencloud-eu/extension-sdk'
import type { Plugin } from 'vite'

/**
 * Plugin to strip version numbers from shared module declarations in the
 * module federation output. The OpenCloud host uses version-based matching
 * for shared modules. If our app declares specific versions (e.g. luxon@3.7.2)
 * but the host provides a different version, federation fails with
 * "must be provided by host". Setting version to undefined (like the official
 * unzip app does) makes federation accept whatever version the host provides.
 */
function stripSharedVersions(): Plugin {
  return {
    name: 'strip-shared-versions',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (
          chunk.type === 'chunk' &&
          (fileName.includes('localSharedImportMap') || fileName.includes('SharedImportMap'))
        ) {
          // Replace version:"X.Y.Z" with version:void 0
          chunk.code = chunk.code.replace(/version:"[^"]+"/g, 'version:void 0')
        }
      }
    }
  }
}

export default defineConfig({
  name: 'web-app-radicale',
  plugins: [stripSharedVersions()]
})
