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

  const cinematic=[3,5,6,7].includes(round);
  const revealDelay=round===3?4500:round===5?6000:round===6?4500:round===7?6500:0;
  const visualLocked=cinematic&&elapsed<revealDelay;
  const revealIn=Math.max(0,Math.ceil((revealDelay-elapsed)/1000));

  const m=team?.metrics||{};
  const ceoMode=m.dependency>=80||m.efficiency>=90?'automation':
    (m.resilience>=70&&m.accountability>=68?'resilience':
    (m.skills>=68||m.initiative>=65?'people':'balanced'));

  const ceoCopy={
    automation:{
      line1:'Ваши решения дали нам очень высокую скорость.',
      line2:'Совет директоров предлагает передать AI ещё 40% управленческих решений.',
      line3:'Рынок вознаграждает нас за эффективность. Готовы идти дальше?',
      future:'Через 3 года: почти все стандартные решения проходят через AI-центр, а менеджеры в основном контролируют исключения.'
    },
    resilience:{
      line1:'Вы сделали систему устойчивее и сохранили человеческую ответственность.',
      line2:'Но конкуренты принимают решения заметно быстрее нас.',
      line3:'Совет директоров спрашивает: не слишком ли дорого нам обходятся защитные механизмы?',
      future:'Через 3 года: компания работает медленнее лидеров рынка, зато переживает сбои без остановки и сохраняет сильный управленческий резерв.'
    },
    people:{
      line1:'Вы вложились в людей, навыки и инициативу.',
      line2:'Это уже видно внутри компании, но экономический эффект ниже максимума.',
      line3:'Теперь инвесторы требуют доказать, что человеческий резерв действительно окупается.',
      future:'Через 3 года: меньше полной автоматизации, зато сильная внутренняя школа, больше новых идей и меньше зависимости от одной системы.'
    },
    balanced:{
      line1:'Вы старались не допустить крайностей.',
      line2:'Компания сохранила и AI-преимущество, и часть человеческого контроля.',
      line3:'Теперь совет директоров хочет понять, где именно вы готовы сделать следующий большой шаг.',
      future:'Через 3 года: смешанная модель — AI ведёт рутину, люди удерживают критические решения, обучение и пересмотр правил.'
    }
  }[ceoMode];

  async function submit(){
    if(!me||!selected||visualLocked)return;
    setBusy(true);
    const r=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,teamId:me.teamId,teamToken:me.teamToken,round,choice:selected})});
    const j=await r.json();setBusy(false);
    if(r.ok)setSaved(j.optionTitle||'Выбор сохранён');
    else alert(j.error||'Ошибка');
  }

  if(!state||!team)return <div className="shell"><div className="formCard card"><h2>Подключение…</h2><p className="muted">Проверяю сессию.</p></div></div>;

  if(round===0)return <div className="shell"><div className="formCard card"><span className="pill">УЧАСТНИК · {team.name}</span><h2 style={{fontSize:42}}>Вы подключены</h2><p className="muted">Компания: {team.company}</p><div className="notice">Ждите запуска. Вас ждут 7 управленческих раундов по 30 секунд, включая визуальные события и последствия ваших решений.</div></div></div>;

  if(state.meta.status==='finished'){
    const r=team.result;
    const report=r?.hostReport;
    if(!r||!report)return <div className="shell"><div className="formCard card"><h2>Формируем результат…</h2></div></div>;
    return <div className="shell"><div className="formCard card resultCard">
      <span className="pill">УЧАСТНИК · {team.name}</span>
      <h2 style={{fontSize:34,marginBottom:4}}>Компания: {team.company}</h2>
      <p className="muted">Ваш персональный итог по 7 управленческим решениям</p>
      <div className="readAloud" style={{marginTop:18}}><span className="pill">ИТОГОВАЯ ТРАЕКТОРИЯ</span><h2 className="trajectoryTitle">{r.title}</h2><p className="trajectoryTag">{r.tagline}</p><p className="resultText">{r.description}</p></div>
      <div className="reportSection"><h3>1. К какому состоянию пришла компания</h3><p>{report.opening}</p><p>{report.state}</p></div>
      <div className="reportSection"><h3>2. Что означают итоговые результаты</h3><div className="metrics">{Object.entries(r.metrics).map(([k,v])=><div className="metric" key={k}><div className="row"><b>{metricLabels[k]}</b><span>{v}/100{k==='dependency'?' ↓':''}</span></div><div className="metricBar"><i style={{width:v+'%'}}/></div>{k==='dependency'&&<small>Для зависимости от AI ниже — лучше.</small>}</div>)}</div><div className="reportMetrics" style={{marginTop:12}}>{report.metricText.map((x,i)=><p key={i}>{x}</p>)}</div></div>
      <div className="reportSection"><h3>3. Как каждое решение изменило траекторию</h3><div className="choiceHistory">{report.rounds.map(x=><div className="historyRow reportRound" key={x.round}><span>0{x.round}</span><div><b>{x.question}</b><p><strong>Ваш выбор:</strong> {x.choice}</p><p>{x.effect}</p></div></div>)}</div></div>
      <div className="reportSection"><h3>4. Как решения сложились в одну стратегию</h3><p>{report.synthesis}</p></div>
      <div className="reportSection"><h3>5. Что будет дальше, если ничего не менять</h3><p>{report.future}</p></div>
      <div className="reportSection"><h3>6. Вывод для менеджмента</h3><p>{report.management}</p><div className="fbgrid" style={{marginTop:12}}><div className="fb"><b>Сильная сторона стратегии</b><p className="muted">{r.strength}</p></div><div className="fb"><b>Главный риск</b><p className="muted">{r.risk}</p></div></div><div className="notice finalQuestion" style={{marginTop:14}}><b>Вопрос вам:</b> {r.question}</div></div>
      <p className="muted" style={{marginTop:18}}>У ведущего отображаются подробные результаты всех участников. Здесь показан только ваш результат.</p>
    </div></div>;
  }

  const already=team.status?.[round]==='chosen';

  return <div className="shell">
    <div className="top">
      <div className="brand"><div className="logo">AI</div><div><h1>{team.name}</h1><small>{team.company} · Раунд {round} из 7</small></div></div>
      <div className="timer">{String(Math.floor(left/60)).padStart(2,'0')}:{String(left%60).padStart(2,'0')}</div>
    </div>

    <main className={'mainCard card '+(cinematic?'visualRound':'')}>
      <span className="pill">{roundData?.kicker} · 30 СЕК</span>
      <h2 className="dilemmaTitle">{roundData?.title}</h2>
      <p className="dilemmaContext">{roundData?.context}</p>

      {round===3&&<div className="chatLeak">
        <div className="chatHead"><div><b># ai-operations</b><span>внутренний канал · только сотрудники</span></div><span className="leakBadge">LEAKED</span></div>
        <div className="chatMsg"><span className="avatar">МК</span><div><b>Марина · Customer Ops <small>10:14</small></b><p>Не знаю, почему отказали клиенту. AI поставил высокий риск — я просто подтвердила.</p></div></div>
        <div className="chatMsg"><span className="avatar">ДА</span><div><b>Дамир · Analytics <small>10:16</small></b><p>Без системы мы уже не сможем быстро пересчитать эти кейсы вручную.</p></div></div>
        <div className="chatMsg"><span className="avatar">ЛС</span><div><b>Лейла · Product <small>10:18</small></b><p>Я хотела предложить другой подход, но AI снова показал “оптимальный”. Не вижу смысла спорить.</p></div></div>
      </div>}

      {round===5&&<div className="signalScreen">
        <div className="signalTop"><div><span className="signalEyebrow">{roundData.visual.eyebrow}</span><h3>{roundData.visual.headline}</h3><small>{roundData.visual.period}</small></div><span className="liveDot">LIVE</span></div>
        <div className="signalGrid">{roundData.visual.stats.map(s=><div className={'signalMetric '+s.tone} key={s.label}><span>{s.label}</span><b>{s.value}</b></div>)}</div>
        <div className="signalAlert"><span>●</span><div><b>SYSTEM STATUS: NORMAL</b><p>{roundData.visual.alert}</p></div></div>
      </div>}

      {round===6&&<div className="newsFrame">
        <div className="newsTop"><span>BREAKING NEWS</span><b>BUSINESS 24</b></div>
        <div className="newsVisual"><div className="newsCompany">{team.company}</div><div className="newsOutage">AI OFFLINE</div><div className="newsTicker">Сбой длится уже 48 часов · часть операций замедлена · клиенты ждут решения</div></div>
        <div className="newsHeadline">После масштабной AI-трансформации компания столкнулась с первым серьёзным отключением</div>
        <p>Источники сообщают: несколько подразделений не смогли быстро вернуться к ручным процессам.</p>
      </div>}

      {round===7&&<div className="ceoExperience">
        <div className="videoFrame">
          <div className="videoTop"><span className="recDot">● REC</span><span>CEO MESSAGE · PRIVATE</span></div>
          <div className="ceoStage"><div className="ceoAvatar">CEO</div><div className="ceoCompany">{team.company}</div></div>
          <div className="subtitles"><p>{ceoCopy.line1}</p><p>{ceoCopy.line2}</p><p>{ceoCopy.line3}</p></div>
        </div>
        <div className={'futureFrame '+ceoMode}>
          <div className="futureLabel">ПРОЕКЦИЯ · +3 ГОДА</div>
          <div className="futureScene"><div className="tower t1"/><div className="tower t2"/><div className="tower t3"/><div className="humanDot h1"/><div className="humanDot h2"/><div className="aiCore">AI</div></div>
          <p>{ceoCopy.future}</p>
        </div>
      </div>}

      {visualLocked&&<div className="signalWait"><span className="scanLine"/><b>{round===7?'Сначала посмотрите обращение и прогноз.':'Сначала изучите материал.'}</b><span>Варианты решения появятся через {revealIn} сек.</span></div>}

      {!visualLocked&&<>
        {cinematic&&<div className="signalQuestion"><span className="pill">ВАШЕ РЕШЕНИЕ</span><h3>{round===5?roundData.question:'Что вы делаете дальше?'}</h3></div>}
        <div className={'choiceGrid '+(cinematic?'choiceReveal':'')}>
          {roundData?.options.map((o,i)=><button key={o.id} className={'choiceCard '+(selected===o.id?'sel':'')} onClick={()=>!already&&setSelected(o.id)} disabled={already}><span className="choiceLetter">{String.fromCharCode(65+i)}</span><div><h4>{o.title}</h4><p>{o.text}</p></div></button>)}
        </div>
        {!already&&!saved&&<button className="btn primary submitChoice" onClick={submit} disabled={!selected||busy}>{busy?'Сохраняем решение…':'Зафиксировать решение'}</button>}
      </>}

      {(already||saved)&&<div className="feedback decisionSaved"><span className="pill">РЕШЕНИЕ ПРИНЯТО</span><h3>{saved||'Ваш выбор уже сохранён'}</h3><p className="muted">Последствия пока скрыты. Они проявятся в вашем итоговом результате после 7-го раунда.</p></div>}
    </main>
  </div>;
}
