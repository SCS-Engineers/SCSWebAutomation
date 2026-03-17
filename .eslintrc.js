module.exports = {
  extends: 'airbnb-base',
  env: {
    node: true,
    es2021: true,
    browser: true, // Allow browser globals like 'document' and 'window'
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    // Disable console warnings - we use logger utility
    'no-console': 'off',

    // Allow Windows line endings (CRLF) since this is a Windows project
    'linebreak-style': ['error', 'windows'],

    // Page object methods don't always use 'this'
    'class-methods-use-this': 'off',

    // Allow for...of loops for Playwright page operations
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],

    // Allow awaits in loops - common in test automation
    'no-await-in-loop': 'off',

    // Playwright uses underscores in some contexts
    'no-underscore-dangle': 'off',

    // Allow require() in addition to import
    'global-require': 'off',

    // Max line length - slightly increased for test automation readability
    'max-len': ['error', {
      code: 120,
      ignoreComments: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],

    // Allow ++ in for loops
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],

    // Prefer const but don't error on let
    'prefer-const': 'warn',

    // Allow single named exports
    'import/prefer-default-export': 'off',

    // Don't require .js extensions
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
    }],

    // Allow devDependencies in test files
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: [
        '**/*.spec.js',
        '**/*.test.js',
        '**/test/**',
        '**/utils/**',
        'playwright.config.js',
      ],
    }],

    // Allow param reassignment for Playwright page context
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: ['page', 'context', 'browser'],
    }],

    // Consistent return not always needed in test helpers
    'consistent-return': 'warn',

    // Allow else after return for readability in complex logic
    'no-else-return': 'off',
  },
};
