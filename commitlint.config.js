// override commitlint ignores as suggested by https://github.com/dependabot/dependabot-core/issues/2445#issuecomment-949633412
module.exports = {
  extends: ["@commitlint/config-conventional"],
  ignores: [(message) => /^Bumps \[.+]\(.+\) from .+ to .+\.$/m.test(message)],
};
