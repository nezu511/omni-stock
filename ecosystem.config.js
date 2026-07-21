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
    {
      // Cloudflare Quick Tunnelを常駐化し、外部（LAN外）からomni-stockにアクセスできるようにする。
      // 起動のたびに新しいランダムなURLが発行される。発行されたURLはこのプロセスの標準出力
      // ログ（pm2のデフォルトログパス: ~/.pm2/logs/cloudflared-tunnel-out.log）に出力され、
      // バックエンドの GET /api/tunnel-url がこのログを読んでフロントのHome画面に表示する。
      // アプリ名を変更する場合は、backend/index.ts の TUNNEL_LOG_PATH も合わせて変更すること。
      name: 'cloudflared-tunnel',
      script: '/opt/homebrew/bin/cloudflared',
      args: 'tunnel --url http://localhost:3001',
      autorestart: true,
      watch: false,
    },
  ],
};
