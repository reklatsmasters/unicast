module.exports = {
  extends: "@comocapital/eslint-config/node",
  overrides: {
    files: [ 'test/**/*.js' ],
    env: {
      jest: true,
    },
    rules: {
      'import/no-unresolved': 'off'
    }
  }
}
