import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  nodeResolve: true,
  coverage: true,
  coverageConfig: {
    report: true
  },
  browsers: [
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'webkit' }),
  ],
  files: `test/*.test.js`,
};
