import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      // credentialless 允许跨域资源加载（不携带凭证），避免 require-corp 导致脚本/字体等加载失败
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
})
