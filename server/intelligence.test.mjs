import test from 'node:test';
import assert from 'node:assert/strict';
import { MockLanguageModelV4 } from 'ai/test';
import { Store } from './store.mjs';
import { Intelligence } from './intelligence.mjs';
test('AI 工具循环仅搜索当前用户且保存提案不直接写入（SDK 模型夹具，非真实模型验收）',async()=>{
 const store=new Store(':memory:');try{
 const one=await store.register('agent_user','test-password-12345',true),two=await store.register('other_user','other-password-12345',true);const source=store.addNote(one.user.id,'正在做一个阅读练习 #阅读');store.addNote(two.user.id,'私人数据不可见 #阅读');
 const usage={inputTokens:{total:10,noCache:10},outputTokens:{total:5,text:5}};let searched;
 let step=0;
 const model=new MockLanguageModelV4({doGenerate:async options=>{
  step++;
  if(step===1)return {content:[{type:'tool-call',toolCallId:'s-1',toolName:'search_notes',input:'{"query":"阅读"}'}],finishReason:{unified:'tool-calls'},usage,warnings:[]};
  if(step===2){searched=JSON.stringify(options.prompt);return {content:[{type:'tool-call',toolCallId:'s-2',toolName:'propose_note',input:'{"text":"待用户确认的新记录"}'}],finishReason:{unified:'tool-calls'},usage,warnings:[]};}
  return {content:[{type:'text',text:'根据笔记提出一个问题 [笔记:'+source.id+']'}],finishReason:{unified:'stop'},usage,warnings:[]};
 }});
 const intelligence=new Intelligence(store);intelligence.model=()=>model;const result=await intelligence.generate(one.user.id,{prompt:'我的阅读练习是什么'});
 assert.ok(searched.includes('正在做一个阅读练习'));assert.ok(!searched.includes('私人数据不可见'));assert.equal(result.proposals.length,1);assert.equal(result.proposals[0].text,'待用户确认的新记录');assert.equal(store.notes(one.user.id).length,1);assert.ok(result.text.includes(source.id));
 }finally{store.close()}
});
