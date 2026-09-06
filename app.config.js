module.exports = ({ config }) => {
  let gitCommit =
    process.env.EAS_BUILD_GIT_COMMIT_HASH?.slice(0, 7) || process.env.GITHUB_SHA?.slice(0, 7) || '';

  if (!gitCommit) {
    try {
      gitCommit = require('child_process').execSync('git rev-parse --short HEAD').toString().trim();
    } catch {
      gitCommit = '';
    }
  }

  return {
    ...config,
    extra: {
      ...config.extra,
      gitCommit,
    },
  };
};
