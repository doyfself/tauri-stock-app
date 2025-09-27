/** @type {import('tailwindcss').Config} */
export default {
  // 告诉 Tailwind 要扫描哪些文件（确保 React 组件中的样式能被识别）
  content: [
    "./index.html",       // 若项目有 index.html，必须加（Tauri React 通常有）
    "./src/**/*.{js,ts,jsx,tsx}", // 扫描 src 下所有 React 文件
  ],
  // 主题配置（暂时用默认，后续可自定义颜色、字体等）
  theme: {
    extend: {},
  },
  // 插件（暂时不加，保持简洁）
  plugins: [],
}