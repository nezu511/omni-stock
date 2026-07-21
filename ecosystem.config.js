const os = require('os');
const path = require('path');
const cloudflaredLogPath = path.join(os.homedir(), '.pm2/logs/cloudflared-tunnel-combined.log');

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
      // 起動のたびに新しいランダムなURLが発行される。cloudflaredは全ログを標準エラー出力に
      // 書くため、out_file/error_fileを同じファイルにまとめて1箇所から読めるようにする。
      // バックエンドの GET /api/tunnel-url がこのログを読んでフロントのHome画面に表示する。
      // アプリ名やログパスを変更する場合は、backend/index.ts の TUNNEL_LOG_PATH も合わせて変更すること。
      name: 'cloudflared-tunnel',
      script: '/opt/homebrew/bin/cloudflared',
      args: 'tunnel --url http://localhost:3001',
      autorestart: true,
      watch: false,
      out_file: cloudflaredLogPath,
      error_file: cloudflaredLogPath,
    },
  ],
};
