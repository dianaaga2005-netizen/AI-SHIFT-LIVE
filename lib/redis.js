const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
export function redisReady(){return Boolean(URL&&TOKEN)}
async function cmd(args){if(!redisReady()) throw new Error('REDIS_NOT_CONFIGURED');const r=await fetch(URL,{method:'POST',headers:{Authorization:`Bearer ${TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store'});if(!r.ok) throw new Error('REDIS_ERROR');const j=await r.json();return j.result}
export async function hset(key,field,value){return cmd(['HSET',key,field,JSON.stringify(value)])}
export async function hget(key,field){const r=await cmd(['HGET',key,field]);return r?JSON.parse(r):null}
export async function hgetall(key){const a=await cmd(['HGETALL',key]);const o={};for(let i=0;i<(a||[]).length;i+=2){try{o[a[i]]=JSON.parse(a[i+1])}catch{o[a[i]]=a[i+1]}}return o}
export async function expire(key,seconds){return cmd(['EXPIRE',key,String(seconds)])}
