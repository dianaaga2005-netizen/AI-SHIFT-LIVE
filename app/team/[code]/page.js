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
    const a=setInterval(load,1400),b=setInterval(()=>setNow(Date.now()),500);
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

  async function submit(){
    if(!me||!selected)return;
    setBusy(true);
    const r=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,teamId:me.teamId,teamToken:me.teamToken,round,choice:selected})});
    const j=await r.json();setBusy(false);
    if(r.ok)setSaved(j.optionTitle||'Выбор сохранён');
    else alert(j.error||'Ошибка');
  }

  if(!state||!team)return <div className="shell"><div className="formCard card"><h2>Подключение…</h2><p className="muted">Проверяю сессию.</p></div></div>;

  if(round===0)return <div className="shell"><div className="formCard card"><span className="pill">{team.name}</span><h2 style={{fontSize:42}}>Вы подключены</h2><p className="muted">Компания: {team.company}</p><div className="notice">Ждите запуска. Вас ждут 6 управленческих дилемм по 30 секунд.</div></div></div>;

  if(state.meta.status==='finished'){
    const r=team.result;
    if(!r)return <div className="shell"><div className="formCard card"><h2>Формируем результат…</h2></div></div>;
    return <div className="shell"><div className="formCard card resultCard">
      <span className="pill">ВАША ТРАЕКТОРИЯ</span>
      <h2 className="trajectoryTitle">{r.title}</h2>
      <p className="trajectoryTag">{r.tagline}</p>
      <p className="resultText">{r.description}</p>

      <div className="metrics">
        {Object.entries(r.metrics).map(([k,v])=><div className="metric" key={k}>
          <div className="row"><b>{metricLabels[k]}</b><span>{v}/100{k==='dependency'?' ↓':''}</span></div>
          <div className="metricBar"><i style={{width:v+'%'}}/></div>
          {k==='dependency'&&<small>Для этого показателя ниже — лучше.</small>}
        </div>)}
      </div>

      <div className="fbgrid" style={{marginTop:18}}>
        <div className="fb"><b>Сильная сторона стратегии</b><p className="muted">{r.strength}</p></div>
        <div className="fb"><b>Главный риск</b><p className="muted">{r.risk}</p></div>
      </div>
      <div className="notice finalQuestion" style={{marginTop:14}}><b>Вопрос вашей команде:</b> {r.question}</div>

      <h3 style={{marginTop:24}}>Ваш путь</h3>
      <div className="choiceHistory">{r.choices.map(x=><div className="historyRow" key={x.round}><span>0{x.round}</span><div><b>{x.question}</b><p>{x.choice}</p></div></div>)}</div>
      <p className="muted" style={{marginTop:18}}>Сравнение траекторий всех команд — на экране ведущего.</p>
    </div></div>;
  }

  const already=team.status?.[round]==='chosen';

  return <div className="shell">
    <div className="top">
      <div className="brand"><div className="logo">AI</div><div><h1>{team.name}</h1><small>{team.company} · Раунд {round} из 6</small></div></div>
      <div className="timer">{String(Math.floor(left/60)).padStart(2,'0')}:{String(left%60).padStart(2,'0')}</div>
    </div>
    <main className="mainCard card">
      <span className="pill">{roundData?.kicker} · 30 СЕК</span>
      <h2 className="dilemmaTitle">{roundData?.title}</h2>
      <p className="dilemmaContext">{roundData?.context}</p>

      <div className="choiceGrid">
        {roundData?.options.map((o,i)=><button key={o.id} className={'choiceCard '+(selected===o.id?'sel':'')} onClick={()=>!already&&setSelected(o.id)} disabled={already}>
          <span className="choiceLetter">{String.fromCharCode(65+i)}</span>
          <div><h4>{o.title}</h4><p>{o.text}</p></div>
        </button>)}
      </div>

      {!already&&!saved&&<button className="btn primary submitChoice" onClick={submit} disabled={!selected||busy}>{busy?'Сохраняем решение…':'Зафиксировать решение'}</button>}
      {(already||saved)&&<div className="feedback decisionSaved"><span className="pill">РЕШЕНИЕ ПРИНЯТО</span><h3>{saved||'Ваш выбор уже сохранён'}</h3><p className="muted">Последствия пока скрыты. Они проявятся в итоговой траектории компании после 6-го раунда.</p></div>}
    </main>
  </div>;
}
