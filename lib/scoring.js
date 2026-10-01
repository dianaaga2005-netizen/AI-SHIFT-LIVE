import {getRound,initialMetrics,metricLabels} from './game';

const IMPACTS={
  1:{
    autopilot:{efficiency:8,resilience:-4,skills:-4,initiative:-3,accountability:-7,dependency:8},
    human_confirm:{efficiency:3,resilience:0,skills:-1,initiative:-1,accountability:3,dependency:3},
    risk_tiers:{efficiency:4,resilience:5,skills:2,initiative:1,accountability:6,dependency:-4},
    challenge_rule:{efficiency:-2,resilience:4,skills:6,initiative:5,accountability:7,dependency:-3}
  },
  2:{
    freeze_junior:{efficiency:6,resilience:-5,skills:-10,initiative:-4,accountability:0,dependency:3},
    academy:{efficiency:-3,resilience:6,skills:10,initiative:4,accountability:2,dependency:-4},
    selective_junior:{efficiency:1,resilience:4,skills:7,initiative:3,accountability:2,dependency:-2},
    redesign_roles:{efficiency:2,resilience:5,skills:6,initiative:8,accountability:4,dependency:-3}
  },
  3:{
    protect_kpi:{efficiency:7,resilience:-2,skills:-2,initiative:-10,accountability:-1,dependency:3},
    innovation_time:{efficiency:-4,resilience:3,skills:5,initiative:10,accountability:1,dependency:-2},
    human_themes:{efficiency:2,resilience:2,skills:2,initiative:7,accountability:3,dependency:0},
    initiative_kpi:{efficiency:1,resilience:0,skills:1,initiative:5,accountability:2,dependency:1}
  },
  4:{
    trust_ai:{efficiency:6,resilience:-4,skills:-5,initiative:-4,accountability:-8,dependency:6},
    explain_decisions:{efficiency:-1,resilience:2,skills:3,initiative:1,accountability:9,dependency:-1},
    red_team:{efficiency:-3,resilience:8,skills:5,initiative:5,accountability:6,dependency:-5},
    alternative_first:{efficiency:-4,resilience:4,skills:7,initiative:5,accountability:5,dependency:-3}
  },
  5:{
    wait_triage:{efficiency:-4,resilience:-6,skills:-3,initiative:-2,accountability:-2,dependency:8},
    full_manual:{efficiency:-8,resilience:5,skills:6,initiative:2,accountability:3,dependency:-6},
    degraded_mode:{efficiency:-2,resilience:10,skills:4,initiative:2,accountability:5,dependency:-8},
    backup_ai:{efficiency:2,resilience:6,skills:-1,initiative:0,accountability:1,dependency:3}
  },
  6:{
    automate_more:{efficiency:10,resilience:-5,skills:-6,initiative:-4,accountability:-4,dependency:8},
    freeze_audit:{efficiency:-3,resilience:6,skills:4,initiative:2,accountability:6,dependency:-4},
    people_invest:{efficiency:-2,resilience:5,skills:10,initiative:7,accountability:2,dependency:-5},
    new_metrics:{efficiency:0,resilience:5,skills:5,initiative:5,accountability:7,dependency:-3}
  }
};

const TRAJECTORIES={
  ai_autopilot:{
    key:'ai_autopilot',title:'AI AUTOPILOT',tagline:'Максимальная скорость, минимальное человеческое трение.',
    description:'Вы последовательно отдавали приоритет эффективности и автоматизации. Компания очень быстрая, но всё сильнее зависит от AI, а самостоятельность людей и личная ответственность менеджеров становятся уязвимыми.',
    strength:'Вы умеете быстро превращать технологическое преимущество в операционный результат.',
    risk:'Главный риск — организация может разучиться замечать ошибку AI и действовать без него.',
    question:'Что произойдёт, если AI впервые будет уверенно неправ — кто это заметит?'
  },
  efficiency_trap:{
    key:'efficiency_trap',title:'ЛОВУШКА ЭФФЕКТИВНОСТИ',tagline:'Показатели растут быстрее, чем способность организации развиваться.',
    description:'Ваши решения хорошо защищают текущие KPI, но часть человеческих навыков и инициативы постепенно исчезает. Краткосрочно модель выглядит очень сильной, долгосрочно кадровый и инновационный резерв сужается.',
    strength:'Вы последовательно защищаете результат и избегаете лишней управленческой сложности.',
    risk:'Компания может обнаружить проблему слишком поздно — когда заменить потерянные навыки уже дорого.',
    question:'Какие показатели предупредят вас о деградации раньше, чем упадёт прибыль?'
  },
  resilient_hybrid:{
    key:'resilient_hybrid',title:'RESILIENT HYBRID',tagline:'AI ускоряет компанию, но не становится единственной опорой.',
    description:'Вы строили резервные контуры, сохраняли ответственность и не позволяли эффективности полностью вытеснить человеческие навыки. Компания чуть менее экстремально быстрая, зато устойчивее к сбоям и ошибкам.',
    strength:'Сильный баланс между автоматизацией, ответственностью и организационной устойчивостью.',
    risk:'Цена вашей модели — дополнительные проверки, обучение и более медленные решения в части процессов.',
    question:'Где защитные механизмы уже начинают стоить компании слишком дорого?'
  },
  human_innovation:{
    key:'human_innovation',title:'HUMAN INNOVATION',tagline:'Люди остаются источником новых идей, AI — усилителем.',
    description:'Вы сознательно сохраняли пространство для обучения, экспериментов и самостоятельных решений. Компания развивает человеческий капитал, даже если ради этого иногда жертвует частью максимальной автоматизации.',
    strength:'Высокий потенциал для инноваций, роста сотрудников и появления будущих лидеров.',
    risk:'При слабой дисциплине эта модель может превратиться в дорогую свободу без достаточной отдачи.',
    question:'Как вы докажете совету директоров, что инвестиции в человеческую инициативу окупаются?'
  },
  accountable_copilot:{
    key:'accountable_copilot',title:'ACCOUNTABLE COPILOT',tagline:'AI советует, человек по-настоящему отвечает.',
    description:'Вы сделали ответственность центральным принципом трансформации. AI активно используется, но решения не становятся безличными: у критических действий остаётся человеческий владелец.',
    strength:'Понятные границы полномочий и высокая управленческая подотчётность.',
    risk:'Менеджеры могут стать чрезмерно осторожными и начать тормозить полезную автоматизацию.',
    question:'Как отличить реальную ответственность от формального подписания решения?'
  },
  balanced:{
    key:'balanced',title:'BALANCED TRANSFORMATION',tagline:'Не максимизация одного показателя, а управляемый компромисс.',
    description:'Вы не выбрали крайность: эффективность, развитие людей, устойчивость и ответственность сохраняются на сопоставимом уровне. Это гибкая модель, но она требует постоянного пересмотра границ между человеком и AI.',
    strength:'Система не зависит от одной управленческой идеи и лучше адаптируется к разным ситуациям.',
    risk:'Компромисс может стать слишком осторожным и не дать компании использовать сильное технологическое преимущество.',
    question:'В какой момент баланс превращается в нерешительность?'
  }
};

const clamp=v=>Math.max(0,Math.min(100,Math.round(v)));

export function applyChoice(currentMetrics,round,choice){
  const r=getRound(round);
  if(!r)return null;
  const option=r.options.find(o=>o.id===choice);
  const impact=IMPACTS[Number(round)]?.[choice];
  if(!option||!impact)return null;
  const base={...initialMetrics,...(currentMetrics||{})};
  const next={};
  for(const key of Object.keys(initialMetrics))next[key]=clamp(base[key]+(impact[key]||0));
  return {choice,optionTitle:option.title,metrics:next};
}

function pickTrajectory(m){
  const human=(m.skills+m.initiative+m.accountability)/3;
  if(m.efficiency>=88&&m.dependency>=78)return TRAJECTORIES.ai_autopilot;
  if(m.efficiency>=86&&(m.skills<=48||m.initiative<=45))return TRAJECTORIES.efficiency_trap;
  if(m.resilience>=72&&m.accountability>=68&&m.dependency<=60)return TRAJECTORIES.resilient_hybrid;
  if(m.skills>=70&&m.initiative>=68)return TRAJECTORIES.human_innovation;
  if(m.accountability>=76&&m.efficiency>=72)return TRAJECTORIES.accountable_copilot;
  if(human<52&&m.efficiency>=82)return TRAJECTORIES.efficiency_trap;
  return TRAJECTORIES.balanced;
}

export function buildTeamResult(team){
  const metrics={...initialMetrics,...(team.metrics||{})};
  const trajectory=pickTrajectory(metrics);
  const positive=['efficiency','resilience','skills','initiative','accountability'];
  const strongest=[...positive].sort((a,b)=>metrics[b]-metrics[a])[0];
  const weakest=[...positive].sort((a,b)=>metrics[a]-metrics[b])[0];
  return {
    ...trajectory,
    metrics,
    strongest:{key:strongest,label:metricLabels[strongest],value:metrics[strongest]},
    weakest:{key:weakest,label:metricLabels[weakest],value:metrics[weakest]},
    dependency:metrics.dependency,
    choices:Object.entries(team.answers||{}).map(([round,a])=>{
      const r=getRound(round);
      const o=r?.options.find(x=>x.id===a.choice);
      return {round:Number(round),question:r?.title||'',choice:o?.title||a.choice};
    }).sort((a,b)=>a.round-b.round)
  };
}

function average(values){return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0}

export function summarizeAudience(teams){
  const finished=teams.map(t=>t.result||buildTeamResult(t));
  const distribution={};
  finished.forEach(r=>{distribution[r.key]=(distribution[r.key]||{title:r.title,count:0});distribution[r.key].count++});
  const metrics={};
  for(const k of Object.keys(initialMetrics))metrics[k]=average(finished.map(r=>r.metrics[k]));
  const positive=['efficiency','resilience','skills','initiative','accountability'];
  const strongest=[...positive].sort((a,b)=>metrics[b]-metrics[a])[0];
  const weakest=[...positive].sort((a,b)=>metrics[a]-metrics[b])[0];
  const roundsSummary=[1,2,3,4,5,6].map(round=>{
    const count={};
    for(const t of teams){const c=t.answers?.[round]?.choice;if(c)count[c]=(count[c]||0)+1}
    const top=Object.entries(count).sort((a,b)=>b[1]-a[1])[0];
    const r=getRound(round); const option=r?.options.find(o=>o.id===top?.[0]);
    return top?{round,question:r.title,choice:option?.title||top[0],count:top[1]}:null;
  }).filter(Boolean);
  return {
    distribution:Object.values(distribution).sort((a,b)=>b.count-a.count),
    metrics,
    strongest:{key:strongest,label:metricLabels[strongest],value:metrics[strongest]},
    weakest:{key:weakest,label:metricLabels[weakest],value:metrics[weakest]},
    dependency:metrics.dependency,
    rounds:roundsSummary,
    insight:'В среднем аудитория сильнее всего сохранила «'+metricLabels[strongest]+'» и слабее всего — «'+metricLabels[weakest]+'». Зависимость от AI в среднем составила '+metrics.dependency+'/100.',
    question:'Если эффективность продолжит расти, какой человеческий элемент управления вы всё равно не готовы отдать AI?'
  };
}
