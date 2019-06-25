module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  },
  "extends": "eslint:recommended", 
  "parserOptions": {
    "ecmaVersion": 5
  },
  "rules": {
    "no-console" : "off",
    "no-empty" : ["warn", { "allowEmptyCatch": true }]
  }
};