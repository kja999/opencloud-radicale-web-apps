import js from '@eslint/js'
import vuePlugin from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import skipFormatting from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', '*.config.js', '*.config.ts']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vuePlugin.configs['flat/essential'],
  skipFormatting,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'vue/multi-word-component-names': 'off'
    }
  }
)