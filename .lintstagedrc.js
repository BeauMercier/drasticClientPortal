/** @type {import('lint-staged').Config} */
module.exports = {
  // Format staged files with Prettier
  '*.{js,jsx,ts,tsx,json,md,mdx,css,scss}': ['npx prettier --write'],

  // Type-check the exact files we're touching (keeps the hook useful)
  '*.{ts,tsx}': () => 'npm run typecheck:staged',
}; 