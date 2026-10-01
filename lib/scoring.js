const RUBRIC_VERSION='free-rubric-v1';

const RISK_CONCEPTS={
  deskilling:['навык','квалификац','самостоятель','деградац'],
  rubberstamp:['соглаш','подпис','провер','критичес','оспар'],
  junior:['junior','джуниор','младш','карьер','кадров'],
  autonomy:['автоном','самостоятель','контрол','свобо'],
  initiative:['инициатив','иде','эксперимент','предлож'],
  accountability:['ответствен','кто отвечает','вина','подотчет'],
  dependency:['зависим','без ai','без ии','отключ','устойчив'],
  metriclock:['kpi','метрик','показател','цель','качество','долгоср']
};

const RULE_CONCEPTS={
  challenge:['оспар','challenge','аргумент против','критичес','провер'],
  skills:['навык','без ai','без ии','трениров','квалификац'],
  junior:['junior','джуниор','младш','карьер','настав'],
  account:['ответствен','конкретн','владелец','named','подотчет'],
  drill:['без ai','без ии','учени','трениров','отключ'],
  redteam:['red team','ред тим','оспар','аудит','вторичн','последств']
};

const RISK_LABELS={
  deskilling:'деградация навыков',rubberstamp:'менеджер-подписант',junior:'исчезновение junior-ступеней',
  autonomy:'потеря автономии',initiative:'снижение инициативы',accountability:'размывание ответственности',
  dependency:'операционная зависимость',metriclock:'оптимизация не той цели'
};

const RULE_LABELS={
  challenge:'Human Challenge Rule',skills:'Skill Preservation',junior:'Junior Development Track',
  account:'Named Accountability',drill:'AI-Free Drill',redteam:'AI Red Team'
};

const CRITERIA_HELP={
  'Причинно-следственная логика':'Покажите цепочку: успех AI → изменение поведения → управленческая проблема → последствие.',
  'Связь с выбранными рисками':'Объясните каждый из трёх выбранных рисков, а не только перечислите их.',
  'Глубина последствий':'Добавьте долгосрочные или вторичные эффекты для людей, процессов, культуры или устойчивости.',
  'Контекст компании':'Привяжите рассуждение к конкретным процессам, сотрудникам, клиентам или особенностям выбранной компании.',
  'Конкретность':'Добавьте конкретный механизм, пример или наблюдаемый эффект.',
  'Конкретность решения':'Опишите, что именно меняется: правило, процесс, роль, частота проверки или граница полномочий.',
  'Ответственность':'Назовите конкретную роль или орган, который отвечает за решение.',
  'Осознанный компромисс':'Назовите цену решения: время, скорость, деньги, нагрузку, качество или риск.',
  'Критерий пересмотра':'Укажите измеримое условие, срок или порог, при котором решение будет пересмотрено.',
  'Баланс AI и человека':'Покажите, что остаётся за AI, а что — за человеком.',
  'Покрытие выбранных правил':'Объясните вклад каждого из трёх выбранных правил.',
  'Системность':'Покажите, как правила дополняют друг друга, а не работают как три отдельные меры.',
  'Цена системы':'Укажите, чем компания сознательно жертвует ради устойчивости.',
  'Реализуемость':'Добавьте исполнителей, периодичность, процедуру или понятный способ внедрения.'
};

function txt(v){return String(v??'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim()}
function words(v){return txt(v).split(/[^a-zа-я0-9%]+/i).filter(Boolean)}
function countHits(text,terms){const t=txt(text);return terms.filter(x=>t.includes(txt(x))).length}
function any(text,terms){return countHits(text,terms)>0}
function cap(n,min,max){return Math.max(min,Math.min(max,n))}
function companyContext(text,company){
  const t=txt(text), c=words(company).filter(x=>x.length>=4);
  const direct=c.some(x=>t.includes(x));
  const context=['компан','отдел','команд','клиент','сотруд','процесс','продукт','сервис','рынок','банк','магазин','проект','операц','руковод','менедж','hr','маркет','продаж','производ'];
  const hits=countHits(t,context);
  return direct?2:hits>=3?2:hits>=1?1:0;
}
function criterion(label,points,max){return {label,points:cap(points,0,max),max}}
function verdict(score){
  if(score>=9)return 'Решение очень сильное: логика, управленческий баланс и последствия проработаны убедительно.';
  if(score>=7)return 'Сильная основа: решение управленчески обосновано, но один-два элемента можно сделать конкретнее.';
  if(score>=5)return 'Рабочая идея есть, но аргументации пока не хватает глубины или конкретики.';
  return 'Ответ пока больше похож на тезис, чем на управленческое решение: нужна более явная логика и механизм действий.';
}
function feedback(criteria){
  const sorted=[...criteria].sort((a,b)=>(b.points/b.max)-(a.points/a.max));
  const weak=[...criteria].sort((a,b)=>(a.points/a.max)-(b.points/b.max))[0];
  const strong=sorted[0];
  const score=criteria.reduce((s,c)=>s+c.points,0);
  return {
    score,
    strong:'Лучше всего проработан критерий «'+strong.label+'» — '+strong.points+'/'+strong.max+'.',
    blind:'Главная зона роста — «'+weak.label+'» ('+weak.points+'/'+weak.max+').',
    verdict:verdict(score),
    improve:CRITERIA_HELP[weak.label]||'Добавьте больше конкретики и причинно-следственных связей.',
    criteria,
    mode:'rubric',
    rubricVersion:RUBRIC_VERSION
  };
}

function round1(company,answer){
  const reasoning=txt(answer?.reasoning);
  const selected=Array.isArray(answer?.risks)?answer.risks:[];
  const wc=words(reasoning).length;
  const causal=['потому','поэтому','привод','в результате','из-за','из за','если','следств','так как','что вед','→'];
  const causalHits=countHits(reasoning,causal);
  const causalPts=wc>=55&&causalHits>=2?3:wc>=35&&causalHits>=1?2:wc>=18?1:0;
  const linked=selected.filter(id=>any(reasoning,RISK_CONCEPTS[id]||[])).length;
  const riskPts=linked>=3?2:linked>=2?1:0;
  const longTerm=['долгоср','в будущем','через','кадров','культур','довер','устойчив','зависим','карьер','качество','мотивац','инициатив','репутац'];
  const people=['сотруд','менедж','команд','junior','джуниор','люд','кадр'];
  const process=['процесс','операц','решени','контрол','провер','систем'];
  const strategy=['долгоср','стратег','рынок','клиент','качество','репутац','устойчив'];
  const domains=[any(reasoning,people),any(reasoning,process),any(reasoning,strategy)].filter(Boolean).length;
  const depthPts=(countHits(reasoning,longTerm)>=2&&domains>=2)?2:(countHits(reasoning,longTerm)>=1||domains>=2)?1:0;
  const contextPts=companyContext(reasoning,company);
  const specific=['например','конкрет','процент','%','месяц','год','роль','отдел','показател','метрик','порог','частот'];
  const specPts=(wc>=70||countHits(reasoning,specific)>=2)?1:0;
  return feedback([
    criterion('Причинно-следственная логика',causalPts,3),
    criterion('Связь с выбранными рисками',riskPts,2),
    criterion('Глубина последствий',depthPts,2),
    criterion('Контекст компании',contextPts,2),
    criterion('Конкретность',specPts,1)
  ]);
}

function round2(answer){
  const decision=txt(answer?.decision), owner=txt(answer?.responsibility), tradeoff=txt(answer?.tradeoff), review=txt(answer?.reviewCondition);
  const dw=words(decision).length;
  const actions=['ввод','назнач','созда','огранич','остав','раздел','провер','обуч','запуска','требу','меняем','измен','пилот','эскалац','утверж'];
  const actionHits=countHits(decision,actions);
  const decisionPts=dw>=35&&actionHits>=2?3:dw>=22&&actionHits>=1?2:dw>=10?1:0;
  const roles=['руковод','директор','менедж','комитет','владелец','head','ceo','hr','совет','началь','лидер','product owner','risk'];
  const ownerPts=owner.length===0?0:any(owner,roles)?2:words(owner).length>=2?1:0;
  const costs=['медлен','скорост','время','затрат','стоим','ресурс','нагруз','производит','эффектив','прибыл','качество','риск','ошиб','ручн'];
  const tradePts=words(tradeoff).length>=8&&countHits(tradeoff,costs)>=1?2:words(tradeoff).length>=4?1:0;
  const measurable=/\d|%/.test(review);
  const reviewMarkers=['если','когда','после','при ','через','еженед','ежемесяч','квартал','месяц','недел','порог','сниз','выраст','более','менее'];
  const reviewPts=(measurable&&any(review,reviewMarkers))?2:words(review).length>=5&&any(review,reviewMarkers)?2:words(review).length>=3?1:0;
  const all=decision+' '+owner+' '+tradeoff+' '+review;
  const ai=any(all,[' ai','ai ','ии','алгоритм','систем']);
  const human=any(all,['человек','менедж','руковод','сотруд','эксперт','команд']);
  const balancePts=ai&&human?1:0;
  return feedback([
    criterion('Конкретность решения',decisionPts,3),
    criterion('Ответственность',ownerPts,2),
    criterion('Осознанный компромисс',tradePts,2),
    criterion('Критерий пересмотра',reviewPts,2),
    criterion('Баланс AI и человека',balancePts,1)
  ]);
}

function round3(company,answer){
  const logic=txt(answer?.systemLogic);
  const selected=Array.isArray(answer?.rules)?answer.rules:[];
  const wc=words(logic).length;
  const covered=selected.filter(id=>any(logic,RULE_CONCEPTS[id]||[])).length;
  const coveragePts=covered>=3?3:covered===2?2:covered===1?1:0;
  const connectors=['вместе','дополня','связ','одновременно','при этом','потому','поэтому','баланс','комбинац','система','если'];
  const connHits=countHits(logic,connectors);
  const systemPts=wc>=50&&connHits>=2?3:wc>=30&&connHits>=1?2:wc>=16?1:0;
  const costs=['медлен','скорост','время','затрат','стоим','ресурс','нагруз','производит','эффектив','прибыл','ручн','жертв','цена'];
  const costHits=countHits(logic,costs);
  const costPts=costHits>=2?2:costHits>=1?1:0;
  const impl=['еженед','ежемесяч','квартал','ответствен','руковод','менедж','комитет','процедур','этап','провер','обуч','аудит','метрик','порог','регуляр','раз в','кажд'];
  const implHits=countHits(logic,impl);
  const ctx=companyContext(logic,company);
  const implPts=(implHits>=2||implHits>=1&&ctx>=1)?2:(implHits>=1||ctx>=1)?1:0;
  return feedback([
    criterion('Покрытие выбранных правил',coveragePts,3),
    criterion('Системность',systemPts,3),
    criterion('Цена системы',costPts,2),
    criterion('Реализуемость',implPts,2)
  ]);
}

export async function scoreAnswer({round,company,answer}){
  if(Number(round)===1)return round1(company,answer);
  if(Number(round)===2)return round2(answer);
  return round3(company,answer);
}

function avg(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0}
function mostCommon(ids){
  const m={}; ids.forEach(x=>{m[x]=(m[x]||0)+1});
  return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
}

export async function summarizeAudience(teams){
  const roundAverages=[1,2,3].map(r=>avg(teams.map(t=>Number(t.scores?.[r]||0))));
  const bestRound=roundAverages.indexOf(Math.max(...roundAverages))+1;
  const allCriteria={};
  for(const t of teams){
    for(const r of [1,2,3]){
      for(const c of t.feedback?.[r]?.criteria||[]){
        if(!allCriteria[c.label])allCriteria[c.label]={points:0,max:0,count:0};
        allCriteria[c.label].points+=c.points; allCriteria[c.label].max+=c.max; allCriteria[c.label].count++;
      }
    }
  }
  const criterionRows=Object.entries(allCriteria).map(([label,v])=>({label,ratio:v.max?v.points/v.max:0}));
  criterionRows.sort((a,b)=>b.ratio-a.ratio);
  const strongest=criterionRows[0]?.label||'управленческая логика';
  const weakest=criterionRows.at(-1)?.label||'конкретность реализации';
  const riskIds=teams.flatMap(t=>t.answers?.[1]?.risks||[]);
  const ruleIds=teams.flatMap(t=>t.answers?.[3]?.rules||[]);
  const risk=mostCommon(riskIds), rule=mostCommon(ruleIds);
  const avgTotal=teams.length?Math.round(avg(teams.map(t=>Object.values(t.scores||{}).reduce((a,b)=>a+Number(b||0),0)))*10)/10:0;
  return {
    best:'Средний итог — '+avgTotal+'/30. Сильнее всего аудитория справилась с критерием «'+strongest+'»; лучший средний результат был в раунде '+bestRound+'.'+(risk?' Чаще всего команды выбирали риск «'+RISK_LABELS[risk]+'».':''),
    blind:'Чаще всего недоработан критерий «'+weakest+'».'+(rule?' В третьем раунде самым популярным правилом было «'+RULE_LABELS[rule]+'», поэтому в обсуждении полезно проверить, не переоценивает ли аудитория один тип защиты.':''),
    question:'Что компания должна сознательно оставить человеку, даже если AI выполняет эту функцию быстрее и точнее — и какую цену она готова за это платить?',
    mode:'rubric',
    rubricVersion:RUBRIC_VERSION
  };
}
