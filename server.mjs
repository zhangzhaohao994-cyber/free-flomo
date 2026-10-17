import express from 'express';
import {createApp} from './server/server.mjs';
const app=express();app.disable('x-powered-by');let runtime;
app.use(async(req,res)=>{try{runtime??=createApp();const service=await runtime;await service.handler(req,res)}catch(e){runtime=null;console.error('Runtime initialization failed:',e.message);if(!res.headersSent)res.status(503).json({error:'后端正在初始化或数据库未就绪，请稍后重试'})}});
export default app;
