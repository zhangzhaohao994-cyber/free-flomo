import {readFileSync} from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID, randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export const hash = s => createHash('sha256').update(s).digest('hex');
export const fail = (status, message) => Object.assign(new Error(message), { status });
export function validNote(raw) {
  if (!raw || typeof raw.id !== 'string' || !/^[\w-]{1,120}$/.test(raw.id) || typeof raw.text !== 'string' || raw.text.length > 100000) throw fail(400, '无效笔记');
  const created = new Date(raw.createdAt), updated = new Date(raw.updatedAt);
  if (!Number.isFinite(+created) || !Number.isFinite(+updated)) throw fail(400, '无效时间');
  const images = raw.images || [];
  if (!Array.isArray(images) || images.length > 9 || images.some(s => typeof s !== 'string' || s.length > 15000000 || !/^data:image\/(png|jpeg|jpg|gif|webp);base64,[a-zA-Z0-9+/=\s]+$/.test(s))) throw fail(400, '无效图片');
  const history = Array.isArray(raw.history) ? raw.history : [];
  if (history.length > 1000 || history.some(h => !h || typeof h.text !== 'string' || h.text.length > 100000 || !Number.isFinite(+new Date(h.at)))) throw fail(400,'历史记录格式无效');
  if (!raw.text.trim() && !images.length) throw fail(400, '空白笔记');
  return { id: raw.id, text: raw.text, images, createdAt: created.toISOString(), updatedAt: updated.toISOString(), pinned: raw.pinned === true, deletedAt: raw.deletedAt && Number.isFinite(+new Date(raw.deletedAt)) ? new Date(raw.deletedAt).toISOString() : null, replyTo: typeof raw.replyTo === 'string' && /^[\w-]{1,120}$/.test(raw.replyTo) ? raw.replyTo : null, history: history.map(h=>({text:h.text,at:new Date(h.at).toISOString()})), ...(raw.demo ? {demo:true} : {}) };
}
export class Store {
  constructor(path) {
    this.db = new DatabaseSync(path);
    this.db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
  }
  async register(username, password, allowRegistration = false) {
    if (typeof username!=='string'|| !/^[\p{L}\p{N}_@.\-]{3,60}$/u.test(username) || typeof password!=='string'||password.length<10||password.length>200) throw fail(400,'用户名 3–60 字；密码 10–200 字');
    if (!allowRegistration && this.db.prepare('SELECT count(*) n FROM users').get().n) throw fail(403,'此服务已关闭公开注册');
    const salt=randomBytes(16).toString('hex'), key=Buffer.from(await scrypt(password,salt,64)).toString('hex'), id=randomUUID();
    if(!allowRegistration&&this.db.prepare('SELECT count(*) n FROM users').get().n)throw fail(403,'此服务已关闭公开注册');
    try{this.db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(id,username,`${salt}:${key}`,new Date().toISOString())}catch{throw fail(409,'用户名已存在')}
    return this.session({id,username});
  }
  async login(username,password) {
    if(typeof username!=='string'||typeof password!=='string'||password.length>200) throw fail(401,'用户名或密码错误');
    const user=this.db.prepare('SELECT * FROM users WHERE username=?').get(username);
    const [salt,key]=(user?.password||'00000000000000000000000000000000:'+'0'.repeat(128)).split(':');
    const derived=Buffer.from(await scrypt(password,salt,64));
    if(!user||!timingSafeEqual(derived,Buffer.from(key,'hex'))) throw fail(401,'用户名或密码错误');
    return this.session(user);
  }
  session(user,label='browser') {const token=randomBytes(32).toString('base64url'),expires=Date.now()+30*86400000;this.db.prepare('INSERT INTO tokens VALUES(?,?,?,?)').run(hash(token),user.id,expires,label);this.db.prepare('DELETE FROM tokens WHERE expires<?').run(Date.now());return {token,user:{id:user.id,username:user.username},expires}}
  auth(token) {if(!token)throw fail(401,'请登录');const u=this.db.prepare('SELECT u.id,u.username FROM users u JOIN tokens t ON u.id=t.user_id WHERE t.hash=? AND t.expires>?').get(hash(token),Date.now());if(!u)throw fail(401,'登录已失效');return u}
  logout(token){this.db.prepare('DELETE FROM tokens WHERE hash=?').run(hash(token))}
  records(user){return this.db.prepare('SELECT id,payload,revision FROM notes WHERE user_id=? ORDER BY revision').all(user).map(r=>({id:r.id,note:r.payload?JSON.parse(r.payload):null,revision:r.revision}))}
  notes(user){return this.records(user).filter(r=>r.note).map(r=>r.note)}
  sync(user,changes=[],purges=[]) {
    if(!Array.isArray(changes)||!Array.isArray(purges)||changes.length+purges.length>10000)throw fail(400,'单次最多同步 10000 项');
    const validated=changes.map(x=>({note:validNote(x.note),baseRevision:Number(x.baseRevision)||0}));
    if(purges.some(p=>!p||typeof p.id!=='string'||!Number.isInteger(p.baseRevision)))throw fail(400,'无效删除请求');
    const conflicts=[],applied=[];this.db.exec('BEGIN IMMEDIATE');
    try{for(const item of [...validated,...purges.map(p=>({...p,note:null}))]){const id=item.note?.id||item.id;const old=this.db.prepare('SELECT revision,payload FROM notes WHERE user_id=? AND id=?').get(user,id);if((old?.revision||0)!==item.baseRevision){conflicts.push({id,revision:old?.revision||0,note:old?.payload?JSON.parse(old.payload):null});continue}
      this.db.prepare('INSERT INTO revisions(user_id,note_id,created_at) VALUES(?,?,?)').run(user,id,new Date().toISOString());const revision=Number(this.db.prepare('SELECT last_insert_rowid() n').get().n);this.db.prepare('INSERT INTO notes VALUES(?,?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET payload=excluded.payload,revision=excluded.revision').run(user,id,item.note?JSON.stringify(item.note):null,revision);applied.push({id,revision})}
      this.db.exec('COMMIT');return {applied,conflicts,records:this.records(user)};
    }catch(e){this.db.exec('ROLLBACK');throw e}
  }
  addNote(user,text,extra={}){const now=new Date().toISOString();const note=validNote({id:randomUUID(),text,images:[],createdAt:now,updatedAt:now,pinned:false,deletedAt:null,...extra});this.sync(user,[{note,baseRevision:0}]);return note}
  bindCode(user){const code=randomBytes(5).toString('hex').toUpperCase();this.db.prepare('DELETE FROM bind_codes WHERE expires<? OR user_id=?').run(Date.now(),user);this.db.prepare('INSERT INTO bind_codes VALUES(?,?,?)').run(code,user,Date.now()+600000);return code}
  bind(openid,code){const row=this.db.prepare('SELECT * FROM bind_codes WHERE code=? AND expires>?').get(code,Date.now());if(!row)throw fail(400,'绑定码无效或已过期');this.db.prepare('INSERT INTO wechat VALUES(?,?) ON CONFLICT(openid) DO UPDATE SET user_id=excluded.user_id').run(openid,row.user_id);this.db.prepare('DELETE FROM bind_codes WHERE code=?').run(code);return row.user_id}
  close(){this.db.close()}
}
