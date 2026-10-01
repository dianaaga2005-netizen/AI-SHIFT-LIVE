import {NextResponse} from 'next/server';import {createSession} from '../../../lib/session';
export async function POST(){try{return NextResponse.json(await createSession())}catch(e){return NextResponse.json({error:e.message==='REDIS_NOT_CONFIGURED'?'Для live-режима нужно добавить Upstash Redis переменные в Vercel.':'Не удалось создать сессию.'},{status:500})}}
