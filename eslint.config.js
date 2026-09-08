const nextConfig = require('eslint-config-next')

module.exports = [
  ...nextConfig,
  {
    files: ['**/__tests__/**/*.{js,jsx,ts,tsx,mjs}'],
    // 测试里的 img 用于模拟 Next/Image，不涉及实际页面图片性能。
    rules: { '@next/next/no-img-element': 'off' },
  },
]
