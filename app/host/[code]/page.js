"use client";
import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {rounds,metricLabels} from '../../../lib/game';

export default function HostDash(){
  const {code}=useParams();
  const [state,setState]=useState(null);
  const [err,setErr]=useState('');
  const [now,setNow]=useState(Date.now());
  const token=typeof window!=='undefined'?localStorage.getItem('aishift_host_'+code):'';

  async function load(){const x=await fetch('/api/state?code='+code,{cache:'no-store'});if(x.ok)setState(await x.json())}
  useEffect(()=>{load();const a=setInterval(load,1500),b=setInterval(()=>setNow(Date.now()),500);return()=>{clearInterval(a);clearInterval(b)}},[code]);

  async function start(round){
    setErr('');
    const x=await fetch('/api/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,hostToken:token,round})});
    if(!x.ok)setErr((await x.json()).error||'Ошибка');
    load();
  }
  async function finish(){
    setErr('');
    const x=await fetch('/api/finish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,hostToken:token})});
    if(!x.ok)setErr((await x.json()).error||'Ошибка');
    load();
  }

  const left=useMemo(()=>{
    if(!state?.meta.startAt||state.meta.status!=='active')return state?.meta.duration||0;
    return Math.max(0,Math.ceil((state.meta.startAt+state.meta.duration*1000-now)/1000));
  },[state,now]);

  const current=rounds.find(r=>r.id===state?.meta.round);
  const answered=state?.teams.filter(t=>t.status?.[state?.meta.round]==='chosen').length||0;
  const total=state?.teams.length||0;

  return <div className="shell">
    <div className="top"><div className="brand"><div className="logo">AI</div><div><h1>AI SHIFT LIVE</h1><small>Ведущий · сессия {code}</small></div></div><Link className="btn ghost" href="/">Главная</Link></div>
    {err&&<div className="notice error">{err}</div>}

    <div className="dash">
      <aside className="side card">
        <div className="pill">КОД ДЛЯ УЧАСТНИКОВ</div>
        <div className="code">{code}</div>
        <div className="notice">Участники открывают сайт → «Я участник» → вводят этот код.</div>

        <div style={{marginTop:20}}>
          <div className="muted">Текущий раунд</div>
          <div style={{fontSize:30,fontWeight:950}}>{state?.meta.round?state.meta.round+'/6':'Лобби'}</div>
          <div className="timer">{String(Math.floor(left/60)).padStart(2,'0')}:{String(left%60).padStart(2,'0')}</div>
          {state?.meta.round>0&&<div className="notice" style={{marginTop:8}}>Выбрали: <b>{answered}/{total}</b></div>}
        </div>

        <div className="roundButtons">
          {rounds.map(r=><button className={'btn '+(state?.meta.round===r.id?'activeRound':'')} key={r.id} onClick={()=>start(r.id)}>Раунд {r.id}</button>)}
        </div>
        <button className="btn primary" onClick={finish} style={{width:'100%',marginTop:10}}>Показать финал</button>
      </aside>

      <main className="mainCard card">
        <div className="row">
          <div><span className="pill">LIVE SIMULATION</span><h2 style={{fontSize:38,margin:'10px 0 0'}}>{state?.meta.status==='finished'?'Результаты участников':current?.title||'Участники подключаются'}</h2></div>
          <div className="score">{total} участников</div>
        </div>

        {state?.meta.status!=='finished'&&<>
          {current&&<div className="notice scenarioPreview" style={{marginTop:16}}><b>{current.kicker}:</b> {current.context}</div>}
          <div className="teams">
            {(state?.teams||[]).map(t=>{
              const r=state?.meta.round||1;
              const st=t.status?.[r]||'waiting';
              return <div className="team" key={t.id}><div className="row"><div><b>{t.name}</b><small>{t.company}</small><span className={'status '+(st==='chosen'?'evaluated':'thinking')}>{st==='chosen'?'ВЫБРАЛИ':'ДУМАЮТ'}</span></div><div className="pill">{st==='chosen'?'✓':'…'}</div></div></div>
            })}
          </div>
        </>}

        {state?.meta.status==='finished'&&<>
          <div className="trajectoryList">
            {(state?.teams||[]).map((t,index)=><div className="trajectoryTeam hostResultCard" key={t.id}>
              <div className="row"><div><b>{t.name}</b><div className="muted">{t.company}</div></div><span className="pill">{t.result?.title||'—'}</span></div>
              <p>{t.result?.tagline}</p>
              {t.result&&<div className="miniMetrics">{Object.entries(t.result.metrics).map(([k,v])=><div key={k}><span>{metricLabels[k]}</span><b>{v}</b></div>)}</div>}

              {t.result?.hostReport&&<details className="hostReport" open={index===0}>
                <summary>Подробный результат — открыть текст для зачитывания</summary>

                <div className="readAloud">
                  <span className="pill">ТЕКСТ ДЛЯ ЗАЧИТЫВАНИЯ</span>
                  <h3>{t.result.hostReport.title}</h3>
                  <p>{t.result.hostReport.readAloud}</p>
                </div>

                <div className="reportSection">
                  <h4>1. К какому состоянию пришла компания</h4>
                  <p>{t.result.hostReport.opening}</p>
                  <p>{t.result.hostReport.state}</p>
                </div>

                <div className="reportSection">
                  <h4>2. Что означают итоговые показатели</h4>
                  <div className="reportMetrics">{t.result.hostReport.metricText.map((x,i)=><p key={i}>{x}</p>)}</div>
                </div>

                <div className="reportSection">
                  <h4>3. Как каждое решение изменило траекторию</h4>
                  <div className="choiceHistory">{t.result.hostReport.rounds.map(x=><div className="historyRow reportRound" key={x.round}><span>0{x.round}</span><div><b>{x.question}</b><p><strong>Выбор:</strong> {x.choice}</p><p>{x.effect}</p></div></div>)}</div>
                </div>

                <div className="reportSection">
                  <h4>4. Как решения сложились в одну стратегию</h4>
                  <p>{t.result.hostReport.synthesis}</p>
                </div>

                <div className="reportSection">
                  <h4>5. Что будет дальше, если ничего не менять</h4>
                  <p>{t.result.hostReport.future}</p>
                </div>

                <div className="reportSection">
                  <h4>6. Вывод для менеджмента</h4>
                  <p>{t.result.hostReport.management}</p>
                  <div className="notice finalQuestion"><b>Вопрос участнику:</b> {t.result.question}</div>
                </div>
              </details>}
            </div>)}
          </div>

          {state.meta.summary&&<div className="feedback">
            <h3>Что получилось у аудитории</h3>
            <div className="distribution">
              {state.meta.summary.distribution?.map(x=><div className="distRow" key={x.title}><b>{x.title}</b><span>{x.count} участников</span></div>)}
            </div>

            <div className="fbgrid" style={{marginTop:14}}>
              <div className="fb"><b>Средняя сильная сторона</b><p className="muted">{state.meta.summary.strongest.label}: {state.meta.summary.strongest.value}/100</p></div>
              <div className="fb"><b>Средняя слабая сторона</b><p className="muted">{state.meta.summary.weakest.label}: {state.meta.summary.weakest.value}/100</p></div>
            </div>
            <div className="notice" style={{marginTop:12}}>{state.meta.summary.insight}</div>

            <h3 style={{marginTop:20}}>Какие решения выбирали чаще всего</h3>
            <div className="choiceHistory">
              {state.meta.summary.rounds?.map(x=><div className="historyRow" key={x.round}><span>0{x.round}</span><div><b>{x.question}</b><p>{x.choice} · {x.count} участников</p></div></div>)}
            </div>

            <div className="notice finalQuestion" style={{marginTop:14}}><b>Вопрос для финальной дискуссии:</b> {state.meta.summary.question}</div>
          </div>}
        </>}
      </main>
    </div>
  </div>;
}
