// 一鍵發佈：建置 → 檢查 → commit → 同步遠端 → push。任何一步失敗就停止，不會推出壞掉的網站。
//   node scripts/ship.mjs "這次改了什麼"
// 推上 main 後，Cloudflare Pages 約一分鐘內自動更新正式站。
import { execFileSync } from 'node:child_process';

const msg = process.argv.slice(2).join(' ').trim();
if (!msg) { console.error('請附上說明，例如：npm run ship -- "更新醫學美容頁的活動文字"'); process.exit(1); }
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', cwd: new URL('..', import.meta.url).pathname, ...opts });
const out = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', cwd: new URL('..', import.meta.url).pathname }).trim();

try {
  const branch = out('git', ['branch', '--show-current']);
  if (branch !== 'main') { console.error(`目前在 ${branch} 分支，發佈只能在 main：請先切回 main`); process.exit(1); }
  console.log('1/4 建置…'); run('node', ['scripts/build.mjs']);
  console.log('2/4 檢查…'); run('node', ['scripts/verify.mjs']);
  if (!out('git', ['status', '--porcelain'])) { console.log('沒有任何變更，不需要發佈。'); process.exit(0); }
  console.log('3/4 提交…'); run('git', ['add', '-A']);
  run('git', ['commit', '-q', '-m', msg]);
  console.log('4/4 同步並推送…');
  run('git', ['pull', '--rebase', '-q', 'origin', 'main']);
  run('node', ['scripts/build.mjs']); // rebase 後重建，避免兩人同時修改造成 public/ 不一致
  if (out('git', ['status', '--porcelain'])) { run('git', ['add', '-A']); run('git', ['commit', '-q', '-m', '重新建置 public/']); }
  run('git', ['push', '-q', 'origin', 'main']);
  console.log('\n✓ 已發佈。約一分鐘後生效：https://lithe-med.com');
} catch (e) {
  console.error('\n✗ 發佈中斷：' + (e.message || e) + '\n（本機已提交的內容不會遺失；排除問題後可再執行一次）');
  process.exit(1);
}
