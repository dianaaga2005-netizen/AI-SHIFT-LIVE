"use client";
import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import {rounds,metricLabels} from '../../../lib/game';

export default function TeamGame(){
  const {code}=useParams();
  const [state,setState]=useState(null);
  const [me,setMe]=useState(null);
  const [selected,setSelected]=useState('');
  const [saved,setSaved]=useState('');
  const [busy,setBusy]=useState(false);
  const [now,setNow]=useState(Date.now());

  useEffect(()=>{
    const x=JSON.parse(localStorage.getItem('aishift_team_'+code)||'null');
    setMe(x);
    const load=async()=>{const r=await fetch('/api/state?code='+code,{cache:'no-store'});if(r.ok)setState(await r.json())};
    load();
    const a=setInterval(load,1400),b=setInterval(()=>setNow(Date.now()),250);
    return()=>{clearInterval(a);clearInterval(b)};
  },[code]);

  const team=state?.teams.find(t=>t.id===me?.teamId);
  const round=state?.meta.round||0;
  const roundData=rounds.find(r=>r.id===round);

  useEffect(()=>{setSelected('');setSaved('')},[round]);

  const left=useMemo(()=>{
    if(!state?.meta.startAt||state.meta.status!=='active')return 0;
    return Math.max(0,Math.ceil((state.meta.startAt+state.meta.duration*1000-now)/1000));
  },[state,now]);

  const elapsed=useMemo(()=>{
    if(!state?.meta.startAt)return 0;
    return Math.max(0,now-state.meta.startAt);
  },[state,now]);

  const revealDelay=roundData?.revealDelayMs||0;
  const visualLocked=roundData?.type==='visual'&&elapsed<revealDelay;
  const revealIn=Math.max(0,Math.ceil((revealDelay-elapsed)/1000));

  async function submit(){
    if(!me||!selected||visualLocked)return;
    setBusy(true);
    const r=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,teamId:me.teamId,teamToken:me.teamToken,round,choice:selected})});
    const j=await r.json();setBusy(false);
    if(r.ok)setSaved(j.optionTitle||'Выбор сохранён');
    else alert(j.error||'Ошибка');
  }

  if(!state||!team)return <div className="shell"><div className="formCard card"><h2>Подключение…</h2><p className="muted">Проверяю сессию.</p></div></div>;

  if(round===0)return <div className="shell"><div className="formCard card"><span className="pill">УЧАСТНИК · {team.name}</span><h2 style={{fontSize:42}}>Вы подключены</h2><p className="muted">Компания: {team.company}</p><div className="notice">Ждите запуска. Вас ждут 7 управленческих раундов по 30 секунд, включая один визуальный сигнал из системы.</div></div></div>;

  if(state.meta.status==='finished'){
    const r=team.result;
    const report=r?.hostReport;
    if(!r||!report)return <div className="shell"><div className="formCard card"><h2>Формируем результат…</h2></div></div>;
    return <div className="shell"><div className="formCard card resultCard">
      <span className="pill">УЧАСТНИК · {team.name}</span>
      <h2 style={{fontSize:34,marginBottom:4}}>Компания: {team.company}</h2>
      <p className="muted">Ваш персональный итог по 7 управленческим решениям</p>

      <div className="readAloud" style={{marginTop:18}}>
        <span className="pill">ИТОГОВАЯ ТРАЕКТОРИЯ</span>
        <h2 className="trajectoryTitle">{r.title}</h2>
        <p className="trajectoryTag">{r.tagline}</p>
        <p className="resultText">{r.description}</p>
      </div>

      <div className="reportSection">
        <h3>1. К какому состоянию пришла компания</h3>
        <p>{report.opening}</p>
        <p>{report.state}</p>
      </div>

      <div className="reportSection">
        <h3>2. Что означают итоговые результаты</h3>
        <div className="metrics">
          {Object.entries(r.metrics).map(([k,v])=><div className="metric" key={k}>
            <div className="row"><b>{metricLabels[k]}</b><span>{v}/100{k==='dependency'?' ↓':''}</span></div>
            <div className="metricBar"><i style={{width:v+'%'}}/></div>
            {k==='dependency'&&<small>Для зависимости от AI ниже — лучше.</small>}
          </div>)}
        </div>
        <div className="reportMetrics" style={{marginTop:12}}>{report.metricText.map((x,i)=><p key={i}>{x}</p>)}</div>
      </div>

      <div className="reportSection">
        <h3>3. Как каждое решение изменило траекторию</h3>
        <div className="choiceHistory">{report.rounds.map(x=><div className="historyRow reportRound" key={x.round}>
          <span>0{x.round}</span>
          <div><b>{x.question}</b><p><strong>Ваш выбор:</strong> {x.choice}</p><p>{x.effect}</p></div>
        </div>)}</div>
      </div>

      <div className="reportSection">
        <h3>4. Как решения сложились в одну стратегию</h3>
        <p>{report.synthesis}</p>
      </div>

      <div className="reportSection">
        <h3>5. Что будет дальше, если ничего не менять</h3>
        <p>{report.future}</p>
      </div>

      <div className="reportSection">
        <h3>6. Вывод для менеджмента</h3>
        <p>{report.management}</p>
        <div className="fbgrid" style={{marginTop:12}}>
          <div className="fb"><b>Сильная сторона стратегии</b><p className="muted">{r.strength}</p></div>
          <div className="fb"><b>Главный риск</b><p className="muted">{r.risk}</p></div>
        </div>
        <div className="notice finalQuestion" style={{marginTop:14}}><b>Вопрос вам:</b> {r.question}</div>
      </div>

      <p className="muted" style={{marginTop:18}}>У ведущего отображаются подробные результаты всех участников. Здесь показан только ваш результат.</p>
    </div></div>;
  }

  const already=team.status?.[round]==='chosen';

  return <div className="shell">
    <div className="top">
      <div className="brand"><div className="logo">AI</div><div><h1>{team.name}</h1><small>{team.company} · Раунд {round} из 7</small></div></div>
      <div className="timer">{String(Math.floor(left/60)).padStart(2,'0')}:{String(left%60).padStart(2,'0')}</div>
    </div>

    <main className={'mainCard card '+(roundData?.type==='visual'?'visualRound':'')}>
      <span className="pill">{roundData?.kicker} · 30 СЕК</span>
      <h2 className="dilemmaTitle">{roundData?.title}</h2>
      <p className="dilemmaContext">{roundData?.context}</p>

      {roundData?.type==='visual'&&<div className="signalScreen">
        <div className="signalTop">
          <div>
            <span className="signalEyebrow">{roundData.visual.eyebrow}</span>
            <h3>{roundData.visual.headline}</h3>
            <small>{roundData.visual.period}</small>
          </div>
          <span className="liveDot">LIVE</span>
        </div>

        <div className="signalGrid">
          {roundData.visual.stats.map(s=><div className={'signalMetric '+s.tone} key={s.label}>
            <span>{s.label}</span>
            <b>{s.value}</b>
          </div>)}
        </div>

        <div className="signalAlert"><span>●</span><div><b>SYSTEM STATUS: NORMAL</b><p>{roundData.visual.alert}</p></div></div>
      </div>}

      {visualLocked&&<div className="signalWait">
        <span className="scanLine"/>
        <b>Сначала просто изучите экран.</b>
        <span>Варианты решения появятся через {revealIn} сек.</span>
      </div>}

      {!visualLocked&&<>
        {roundData?.type==='visual'&&<div className="signalQuestion"><span className="pill">ВАШЕ РЕШЕНИЕ</span><h3>{roundData.question}</h3></div>}
        <div className={'choiceGrid '+(roundData?.type==='visual'?'choiceReveal':'')}>
          {roundData?.options.map((o,i)=><button key={o.id} className={'choiceCard '+(selected===o.id?'sel':'')} onClick={()=>!already&&setSelected(o.id)} disabled={already}>
            <span className="choiceLetter">{String.fromCharCode(65+i)}</span>
            <div><h4>{o.title}</h4><p>{o.text}</p></div>
          </button>)}
        </div>

        {!already&&!saved&&<button className="btn primary submitChoice" onClick={submit} disabled={!selected||busy}>{busy?'Сохраняем решение…':'Зафиксировать решение'}</button>}
      </>}

      {(already||saved)&&<div className="feedback decisionSaved"><span className="pill">РЕШЕНИЕ ПРИНЯТО</span><h3>{saved||'Ваш выбор уже сохранён'}</h3><p className="muted">Последствия пока скрыты. Они проявятся в вашем итоговом результате после 7-го раунда.</p></div>}
    </main>
  </div>;
}
