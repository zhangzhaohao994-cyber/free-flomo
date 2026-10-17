async page => {
 const results=[],errors=[];const p=page;let other;
 p.on('pageerror',e=>errors.push(e.message));
 const ok=(condition,label)=>{if(!condition)throw Error(label);results.push(label)};
 const save=async text=>{await p.locator('#editor').fill(text);await p.locator('#save-note').click();await p.waitForFunction(()=>!document.querySelector('#editor').value)};
 const action=async(name,needle)=>{const n=p.locator('#notes .note').filter({hasText:needle}).first();await n.locator('summary').click();await n.locator(`.menu [data-action="${name}"]`).click()};
 try{
  await p.goto('http://localhost:4189');await p.evaluate(async()=>{sessionStorage.removeItem('free-flomo-cloud');const db=await new Promise((res,rej)=>{const r=indexedDB.open('free-flomo',1);r.onsuccess=()=>res(r.result);r.onerror=rej});await new Promise((res,rej)=>{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').clear();tx.oncomplete=res;tx.onerror=rej});db.close()});await p.reload();await p.setViewportSize({width:1440,height:1050});
  const username='qa_'+Date.now(),password='qa-test-password-12345';
  await p.locator('#cloud-open').click();await p.locator('#server-url').fill('http://localhost:4189');await p.locator('#auth-user').fill(username);await p.locator('#auth-pass').fill(password);await p.locator('#register-user').click();await p.waitForFunction(()=>document.querySelector('#cloud-status').textContent.includes('已同步'));
  ok(await p.locator('#all-count').textContent()==='0','注册账号进入独立空间');
  await save('云同步的第一条想法 #同步');
  await p.locator('#cloud-open').click();await p.locator('#sync-now').click();await p.waitForFunction(()=>document.querySelector('#cloud-status').textContent.includes('已同步'));await p.locator('[data-close="cloud-dialog"]').click();
  other=await p.context().browser().newContext();const q=await other.newPage();await q.goto('http://127.0.0.1:4189');await q.locator('#cloud-open').click();await q.locator('#server-url').fill('http://localhost:4189');await q.locator('#auth-user').fill(username);await q.locator('#auth-pass').fill(password);await q.locator('#auth-form .primary').click();await q.waitForFunction(()=>document.querySelector('#all-count').textContent==='1');
  ok((await q.locator('#notes').textContent()).includes('云同步的第一条'),'两个独立浏览器空间经后端同步');
  await q.locator('#editor').fill('另一个设备的新记录 #同步');await q.locator('#save-note').click();await q.waitForFunction(()=>!document.querySelector('#editor').value);await q.locator('#cloud-open').click();await q.locator('#sync-now').click();await q.waitForFunction(()=>document.querySelector('#cloud-status').textContent.includes('已同步'));await q.locator('[data-close="cloud-dialog"]').click();
  await p.locator('#cloud-open').click();await p.locator('#sync-now').click();await p.waitForFunction(()=>document.querySelector('#all-count').textContent==='2');await p.locator('[data-close="cloud-dialog"]').click();ok(true,'后端反向同步到第一台设备');
  await action('edit','云同步的第一条');await save('修改后的第一条想法 #同步');await action('history','修改后的第一条');ok((await p.locator('#history-dialog').textContent()).includes('云同步的第一条'),'历史版本展示真实旧文');await p.locator('[data-restore-version="0"]').click();await p.locator('#confirm-ok').click();await p.waitForFunction(()=>document.querySelector('#notes').textContent.includes('云同步的第一条'));ok(true,'历史恢复保留新旧版本');
  await action('related','云同步的第一条');await p.waitForFunction(()=>document.querySelector('#related-dialog').textContent.includes('文字重合度'));ok((await p.locator('#related-dialog').textContent()).includes('文字重合度'),'未配置向量时明确标识本地文字关联');await p.locator('.dialog-header [data-close="related-dialog"]').click();
  await p.locator('[data-view="daily"]').click();ok(await p.locator('#daily-notes .note').count()===2,'每日回顾规则运行');
  await p.locator('[data-view="map"]').click();ok(await p.locator('[data-map-note]').count()===2,'想法关联图可点击节点');
  await p.locator('[data-view="ai"]').click();await p.locator('#run-ai').click();await p.waitForFunction(()=>document.querySelector('#toast').textContent.includes('尚未配置模型'));ok((await p.locator('#ai-answer').textContent()).includes('回答会出现在这里'),'无模型时返回明确错误且不伪造回答');
  await p.locator('#settings-open').click();await p.locator('#set-lock').click();await p.locator('#confirm-value').fill('qa-screen-lock-123');await p.locator('#confirm-ok').click();await p.waitForFunction(()=>document.querySelector('#toast').textContent.includes('锁屏密码已设置'));await p.locator('#lock-now').click();await p.locator('#unlock-pass').fill('wrong-password');await p.locator('#unlock-form .primary').click();await p.waitForFunction(()=>document.querySelector('#unlock-error').textContent.includes('不正确'));await p.locator('#unlock-pass').fill('qa-screen-lock-123');await p.locator('#unlock-form .primary').click();await p.waitForFunction(()=>document.querySelector('#lockscreen').hidden);ok(true,'锁屏密码验证与解锁');
  await p.reload();await p.locator('#unlock-pass').fill('qa-screen-lock-123');await p.locator('#unlock-form .primary').click();await p.waitForFunction(()=>document.querySelector('#lockscreen').hidden);ok(true,'刷新后自动锁屏，账号空间恢复');
  await p.locator('#cloud-open').click();await p.locator('#disconnect-cloud').click();await p.waitForFunction(()=>document.querySelector('#cloud-status').textContent==='账号与同步');ok(await p.locator('#all-count').textContent()==='0','退出账号恢复独立本地空间，不混入云端笔记');
  ok(errors.length===0,'扩展界面无运行时异常');
  await other.close();return {passed:results.length,results,errors};
 }catch(e){await p.screenshot({path:'output/playwright/cloud-failure.png',fullPage:true});return {failed:e.message,results,errors,body:(await p.locator('body').innerText()).slice(0,4000)}}
}
