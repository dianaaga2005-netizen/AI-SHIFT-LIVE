import {hget,hgetall,hset,expire,redisReady} from './redis';
const ttl=60*60*8;
export const key=code=>`aishift:${code}`;
export function code6(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<6;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s}
export function token(){return crypto.randomUUID()}
export async function createSession(){if(!redisReady())throw new Error('REDIS_NOT_CONFIGURED');let code=code6();const hostToken=token();const meta={code,hostToken,round:0,status:'lobby',startAt:null,duration:0,createdAt:Date.now()};await hset(key(code),'meta',meta);await expire(key(code),ttl);return{code,hostToken}}
export async function getMeta(code){return hget(key(code),'meta')}
export async function setMeta(code,meta){await hset(key(code),'meta',meta);await expire(key(code),ttl)}
export async function all(code){return hgetall(key(code))}
export async function putTeam(code,team){await hset(key(code),`team:${team.id}`,team);await expire(key(code),ttl)}
