import {changePassword} from './account.mjs';
import {Readable} from 'node:stream';
import {createTransfer,writePart,readPart,outgoing,incoming,removeTransfer,findTransfer} from './transfers.mjs';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Store, fail } from './store.mjs';
import { Intelligence, rank } from './intelligence.mjs';
import { signature,verifyWechat,decryptWechat,encryptWechat,parseXml,replyXml } from './wechat.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const str=(v,max=100000)=>typeof v==='string'&&v.length<=max;
export async function createApp(options={}){
 const env=options.env||process.env,dataDir=options.dataDir||resolve(root,'.data');
 let store=options.store;if(!store){if(env.TURSO_DATABASE_URL){const{RemoteStore}=await import('./remote-store.mjs');store=await RemoteStore.create({url:env.TURSO_DATABASE_URL,authToken:env.TURSO_AUTH_TOKEN})}else{if(env.VERCEL)throw new Error('公网数据库未配置，拒绝使用临时文件系统');await mkdir(dataDir,{recursive:true});store=new Store(resolve(dataDir,'notes.sqlite'))}}
 const intelligence=new Intelligence(store,{deepseekKey:env.DEEPSEEK_API_KEY,deepseekModel:env.DEEPSEEK_MODEL||'deepseek-flash',apiKey:env.AI_GATEWAY_API_KEY,model:env.AI_MODEL,embeddingModel:env.EMBEDDING_MODEL,speechUrl:env.SPEECH_API_URL,speechKey:env.SPEECH_API_KEY,wechatToken:env.WECHAT_TOKEN});
 const origins=new Set((env.ALLOWED_ORIGINS||'http://127.0.0.1:4187,http://localhost:4187,http://127.0.0.1:4188,http://localhost:4188,https://zhangzhaohao994-cyber.github.io').split(',').map(s=>s.trim()));
 const attempts=new Map();const bodyLimit=50*1024*1024;
 function rate(req,key,max=10){const now=Date.now(),id=(req.socket.remoteAddress||'unknown')+':'+key,old=attempts.get(id);if(!old||old.until<now){attempts.set(id,{n:1,until:now+60000});return}if(++old.n>max)throw fail(429,'请求过于频繁，请稍后再试');if(attempts.size>10000)for(const[k,v]of attempts)if(v.until<now)attempts.delete(k)}
 async function rawBody(req){const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>bodyLimit)throw fail(413,'请求超过 50 MB');chunks.push(chunk)}return Buffer.concat(chunks)}
 async function body(req){const raw=await rawBody(req);try{return JSON.parse(raw.toString()||'{}')}catch{throw fail(400,'JSON 格式错误')}}
 let accessToken=null;
 async function wxToken(){if(accessToken&&accessToken.until>Date.now())return accessToken.token;if(!env.WECHAT_APP_ID||!env.WECHAT_APP_SECRET)throw fail(503,'微信媒体接口未配置');const u=new URL('https://api.weixin.qq.com/cgi-bin/token');u.search=new URLSearchParams({grant_type:'client_credential',appid:env.WECHAT_APP_ID,secret:env.WECHAT_APP_SECRET});const r=await fetch(u,{signal:AbortSignal.timeout(15000)}),j=await r.json();if(!j.access_token)throw fail(502,'微信服务凭证获取失败');accessToken={token:j.access_token,until:Date.now()+Math.max(60,j.expires_in-120)*1000};return j.access_token}
 async function wechat(req,url){
  const xml=req.method==='POST'?(await rawBody(req)).toString():null,outer=xml?parseXml(xml):null,encrypted=outer?.Encrypt||(req.method==='GET'&&url.searchParams.has('msg_signature')?url.searchParams.get('echostr'):null);verifyWechat(url,env.WECHAT_TOKEN,encrypted);
  if(req.method==='GET'){const echo=url.searchParams.get('echostr')||'';return {text:url.searchParams.has('msg_signature')?decryptWechat(echo,env.WECHAT_AES_KEY,env.WECHAT_APP_ID):echo,type:'text/plain'}}
  if(encrypted&&(!env.WECHAT_AES_KEY||!env.WECHAT_APP_ID))throw fail(503,'微信加密配置缺失');const msg=parseXml(encrypted?decryptWechat(encrypted,env.WECHAT_AES_KEY,env.WECHAT_APP_ID):xml);
  if(!msg.FromUserName||!msg.ToUserName)throw fail(400,'微信消息格式错误');const messageId=msg.MsgId||[msg.FromUserName,msg.CreateTime,msg.Event].join(':');
  if((await store.db.prepare('SELECT id FROM processed_messages WHERE id=?').get(messageId)))return {text:'success',type:'text/plain'};
  let answer='支持文字、图片。绑定请输入：绑定 绑定码';
  const content=(msg.Content||'').trim();
  if(/^绑定\s+\w+$/u.test(content)){await store.bind(msg.FromUserName,content.split(/\s+/)[1].toUpperCase());answer='已绑定免费浮墨。现在发文字或图片即可记录。'}
  else{const binding=(await store.db.prepare('SELECT user_id FROM wechat WHERE openid=?').get(msg.FromUserName));if(binding){const user=binding.user_id;if(content==='/解绑'){(await store.db.prepare('DELETE FROM wechat WHERE openid=?').run(msg.FromUserName));answer='已解绑。'}else if(content.startsWith('/搜索 ')){const found=rank(content.slice(4),await store.notes(user)).slice(0,3);answer=found.length?found.map(x=>x.note.text.slice(0,450)).join('\n——\n'):'没有找到相关记录。'}else if(content==='/回顾'){const all=(await store.notes(user)).filter(n=>!n.deletedAt);answer=all.length?all[Math.floor(Math.random()*all.length)].text.slice(0,1200):'还没有笔记，先发来一个想法吧。'}else if(msg.MsgType==='text'&&content){await store.addNote(user,content);answer='已记录 ✓'}else if(msg.MsgType==='image'&&msg.MediaId){const token=await wxToken(),u=new URL('https://api.weixin.qq.com/cgi-bin/media/get');u.search=new URLSearchParams({access_token:token,media_id:msg.MediaId});const response=await fetch(u,{signal:AbortSignal.timeout(15000)}),type=response.headers.get('content-type')?.split(';')[0];if(!response.ok||!/^image\/(png|jpeg|webp|gif)$/.test(type))throw fail(502,'图片获取失败');const data=Buffer.from(await response.arrayBuffer());if(data.length>10*1024*1024)throw fail(413,'图片大于 10 MB');await store.addNote(user,'',{images:['data:'+type+';base64,'+data.toString('base64')]});answer='图片已记录 ✓'}}}
  (await store.db.prepare('INSERT OR IGNORE INTO processed_messages VALUES(?,?)').run(messageId,new Date().toISOString()));let reply=replyXml(msg,answer);if(encrypted){const enc=encryptWechat(reply,env.WECHAT_AES_KEY,env.WECHAT_APP_ID),timestamp=String(Math.floor(Date.now()/1000)),nonce=randomUUID();reply=`<xml><Encrypt><![CDATA[${enc}]]></Encrypt><MsgSignature><![CDATA[${signature(env.WECHAT_TOKEN,timestamp,nonce,enc)}]]></MsgSignature><TimeStamp>${timestamp}</TimeStamp><Nonce><![CDATA[${nonce}]]></Nonce></xml>`}return {text:reply,type:'application/xml'};
 }
 async function handler(req,res){
  const started=Date.now();let status=200,responseUser=null;
  const send=async(code,value,type='application/json')=>{if(type==='application/json'&&responseUser&&code===200&&!req.url.startsWith('/api/transfers/')&&Buffer.byteLength(JSON.stringify(value))>Number(env.TRANSFER_THRESHOLD||3000000))value=await outgoing(store,responseUser,JSON.stringify(value));status=code;res.writeHead(code,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store'});res.end(type==='application/json'?JSON.stringify(value):value)};
  try{
   const url=new URL(req.url,'http://localhost'),path=url.pathname,origin=req.headers.origin;
   res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
   if(origin){if(!origins.has(origin)&&!(env.VERCEL&&origin==='https://'+req.headers.host))throw fail(403,'此网页来源未在服务端授权');res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type,MCP-Protocol-Version');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS')}
   if(req.method==='OPTIONS'){await send(204,'','text/plain');return}
   if(path==='/api/health'&&req.method==='GET'){await send(200,{ok:true,version:'0.2.0',...intelligence.status()});return}
   if(path==='/integrations/wechat'&&['GET','POST'].includes(req.method)){rate(req,'wx',120);const reply=await wechat(req,url);await send(200,reply.text,reply.type);return}
   if(path==='/api/auth/register'&&req.method==='POST'){rate(req,'auth',8);const b=await body(req);await send(201,await store.register(b.username,b.password,env.ALLOW_REGISTRATION==='true'));return}
   if(path==='/api/auth/login'&&req.method==='POST'){rate(req,'auth',8);const b=await body(req);await send(200,await store.login(b.username,b.password));return}
   if(path.startsWith('/api/')||path==='/mcp'){
    const token=(req.headers.authorization||'').replace(/^Bearer /i,''),user=await store.auth(token);responseUser=user.id;rate(req,path.startsWith('/api/transfers')?'transfer':'api',path.startsWith('/api/transfers')?1200:240);
    if(path==='/api/transfers'&&req.method==='POST'){const b=await body(req);if(!['/api/sync','/api/transcribe'].includes(b.route)||b.method!=='POST')throw fail(400,'不支持此传输目标');const id=await createTransfer(store,user.id,{...b,direction:'upload'});await send(201,{id});return}
    if(path.startsWith('/api/transfers/')){const seg=path.split('/'),id=seg[3];if(req.method==='DELETE'&&seg.length===4){await findTransfer(store,user.id,id);await removeTransfer(store,id);await send(200,{ok:true});return}if(seg[4]==='commit'&&req.method==='POST'){const{text,transfer}=await incoming(store,user.id,id);const internal=Readable.from([Buffer.from(text)]);internal.url=transfer.route;internal.method=transfer.method;internal.headers={authorization:req.headers.authorization,'content-type':'application/json'};internal.socket=req.socket;await handler(internal,res);await removeTransfer(store,id);return}const index=Number(seg[4]);if(req.method==='PUT'){const b=await body(req);await writePart(store,user.id,id,index,b.data);await send(200,{ok:true});return}if(req.method==='GET'){await send(200,{data:await readPart(store,user.id,id,index)});return}throw fail(405,'不支持的传输方法')}
    if(path==='/api/auth/password'&&req.method==='POST'){rate(req,'password',5);const b=await body(req);await send(200,await changePassword(store,user.id,b.current,b.next,token));return}
    if(path==='/api/auth/logout'&&req.method==='POST'){await store.logout(token);await send(200,{ok:true});return}
    if(path==='/api/me'&&req.method==='GET'){await send(200,{user,...intelligence.status()});return}
    if(path==='/api/token'&&req.method==='POST'){await send(201,await store.session(user,'api'));return}
    if(path==='/api/notes'&&req.method==='GET'){await send(200,{records:await store.records(user.id)});return}
    if(path==='/api/notes'&&req.method==='POST'){const b=await body(req);if(!str(b.text))throw fail(400,'笔记文字无效');await send(201,{note:await store.addNote(user.id,b.text)});return}
    if(path==='/api/sync'&&req.method==='POST'){const b=await body(req);await send(200,await store.sync(user.id,b.changes,b.purges));return}
    if(path==='/api/prefs'&&req.method==='GET'){await send(200,JSON.parse((await store.db.prepare('SELECT payload FROM prefs WHERE user_id=?').get(user.id))?.payload||'{}'));return}
    if(path==='/api/prefs'&&req.method==='PUT'){const b=await body(req);if(JSON.stringify(b).length>20000)throw fail(413,'设置过大');(await store.db.prepare('INSERT INTO prefs VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload').run(user.id,JSON.stringify(b)));await send(200,{ok:true});return}
    if(path==='/api/related'&&req.method==='POST'){rate(req,'ai-related',20);const b=await body(req);if(!str(b.text))throw fail(400,'内容无效');await send(200,await intelligence.related(user.id,b.text,b.excludeId||''));return}
    if(path==='/api/ai'&&req.method==='POST'){rate(req,'ai',10);await send(200,await intelligence.generate(user.id,await body(req)));return}
    if(path==='/api/memory'&&req.method==='GET'){const row=(await store.db.prepare('SELECT payload,created_at FROM ai_memory WHERE user_id=?').get(user.id));await send(200,row?{text:row.payload,createdAt:row.created_at}:null);return}
    if(path==='/api/memory'&&req.method==='PUT'){const b=await body(req);if(!str(b.text))throw fail(400,'内容无效');(await store.db.prepare('INSERT INTO ai_memory VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload,created_at=excluded.created_at').run(user.id,b.text,new Date().toISOString()));await send(200,{ok:true});return}
    if(path==='/api/reminders'&&req.method==='GET'){await send(200,{items:(await store.db.prepare('SELECT * FROM reminders WHERE user_id=? ORDER BY due_at').all(user.id))});return}
    if(path==='/api/reminders'&&req.method==='POST'){const b=await body(req);if(!str(b.text,5000)||!Number.isFinite(+new Date(b.dueAt)))throw fail(400,'提醒无效');const id=randomUUID();(await store.db.prepare('INSERT INTO reminders VALUES(?,?,?,?,0)').run(id,user.id,b.text,new Date(b.dueAt).toISOString()));await send(201,{id});return}
    if(path.startsWith('/api/reminders/')&&req.method==='DELETE'){(await store.db.prepare('DELETE FROM reminders WHERE id=? AND user_id=?').run(path.split('/').pop(),user.id));await send(200,{ok:true});return}
    if(path==='/api/wechat/bind-code'&&req.method==='POST'){if(!env.WECHAT_TOKEN)throw fail(503,'服务端尚未配置微信服务号');await send(200,{code:await store.bindCode(user.id),expiresIn:600});return}
    if(path==='/api/transcribe'&&req.method==='POST'){
     rate(req,'speech',5);if(!env.SPEECH_API_URL||!env.SPEECH_API_KEY||!env.SPEECH_MODEL)throw fail(503,'服务器尚未配置语音转写服务');const b=await body(req);b.mime=String(b.mime||'').split(';')[0];if(!str(b.audio,40000000)||!/^audio\/(webm|mp4|mpeg|ogg|wav)(;codecs=\w+)?$/.test(b.mime||''))throw fail(400,'音频格式无效');const data=Buffer.from(b.audio,'base64');if(data.length>25*1024*1024)throw fail(413,'录音超过 25 MB');const fd=new FormData();fd.set('file',new Blob([data],{type:b.mime}),'recording.'+(b.mime.includes('mp4')?'m4a':b.mime.split('/')[1].split(';')[0]));fd.set('model',env.SPEECH_MODEL);const response=await fetch(env.SPEECH_API_URL,{method:'POST',headers:{Authorization:'Bearer '+env.SPEECH_API_KEY},body:fd,signal:AbortSignal.timeout(120000)});if(!response.ok)throw fail(502,'转写服务返回错误 '+response.status);const r=await response.json();if(typeof r.text!=='string')throw fail(502,'转写结果格式无效');await send(200,{text:r.text});return;
    }
    if(path==='/mcp'&&req.method==='POST'){
     const rpc=await body(req),id=rpc.id??null;const respond=async result=>await send(200,{jsonrpc:'2.0',id,result});
     if(rpc.method==='notifications/initialized'){await send(202,'','text/plain');return}
     if(rpc.method==='initialize'){await respond({protocolVersion:'2025-03-26',capabilities:{tools:{}},serverInfo:{name:'free-flomo',version:'0.2.0'}});return}
     if(rpc.method==='tools/list'){await respond({tools:[{name:'search_notes',description:'搜索自己账号的笔记',inputSchema:{type:'object',properties:{query:{type:'string'}},required:['query']}},{name:'save_note',description:'在自己的免费浮墨账号新增笔记',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}},{name:'get_memory',description:'读取自己的已生成记忆档案',inputSchema:{type:'object',properties:{}}}]});return}
     if(rpc.method==='tools/call'){const {name,arguments:a={}}=rpc.params||{};let result;if(name==='search_notes'&&str(a.query,10000))result=rank(a.query,await store.notes(user.id)).slice(0,10).map(r=>r.note);else if(name==='save_note'&&str(a.text))result=await store.addNote(user.id,a.text);else if(name==='get_memory')result=(await store.db.prepare('SELECT payload,created_at FROM ai_memory WHERE user_id=?').get(user.id))||null;else{await send(200,{jsonrpc:'2.0',id,error:{code:-32602,message:'未知工具或无效参数'}});return}await respond({content:[{type:'text',text:JSON.stringify(result)}]});return}
     await send(200,{jsonrpc:'2.0',id,error:{code:-32601,message:'未知方法'}});return;
    }
    throw fail(404,'没有这个接口');
   }
   if(req.method==='GET'&&(path==='/'||path==='/index.html')){await send(200,await readFile(resolve(root,'index.html'),'utf8'),'text/html');return}
   if(req.method==='GET'&&['/sw.js','/manifest.webmanifest','/icon.svg'].includes(path)){const types={'/sw.js':'application/javascript','/manifest.webmanifest':'application/manifest+json','/icon.svg':'image/svg+xml'};await send(200,await readFile(resolve(root,path.slice(1)),'utf8'),types[path]);return}
   if(path==='/favicon.ico'){await send(204,'','text/plain');return}throw fail(404,'页面不存在');
  }catch(e){await send(e.status||500,{error:e.status?e.message:'服务器内部错误'});if(!e.status)console.error(e.stack)}
  finally{if(options.log!==false)console.log(`${req.method} ${req.url.split('?')[0]} ${status} ${Date.now()-started}ms`)}
 }
 const server=http.createServer(handler);server.requestTimeout=150000;server.headersTimeout=15000;return {server,handler,store,intelligence,close:()=>new Promise(resolve=>server.close(()=>{store.close();resolve()}))};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const app=await createApp(),port=Number(process.env.PORT)||4188,host=process.env.HOST||'127.0.0.1';app.server.listen(port,host,()=>console.log(`免费浮墨服务已启动 http://${host}:${port}`));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>app.close().then(()=>process.exit(0)))}
