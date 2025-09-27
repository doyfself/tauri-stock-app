// postcss.config.js (新的、正确的配置)
export default {
  plugins: {
    '@tailwindcss/postcss': {}, // <-- 修改为这个
    autoprefixer: {},
  },
}