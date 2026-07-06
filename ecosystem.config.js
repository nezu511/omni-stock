module.exports = {
  apps: [
    {
      name: 'omni-stock',
      cwd: __dirname + '/backend',
      script: 'npx',
      args: 'tsx index.ts',
      autorestart: true,
      watch: false,
    },
  ],
};
