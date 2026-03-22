const userAgent = process.env.npm_config_user_agent ?? ''

if (userAgent.startsWith('yarn/')) {
  console.error('This project is npm-only. Please use `npm ci` or `npm install`.')
  process.exit(1)
}

if (userAgent.startsWith('pnpm/')) {
  console.error('This project is npm-only. Please use `npm ci` or `npm install`.')
  process.exit(1)
}
