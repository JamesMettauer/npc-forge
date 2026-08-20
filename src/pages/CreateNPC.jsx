import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import NavControls from '@/components/NavControls';
import ModeChooser from '@/components/npc/ModeChooser';
import NPCWizard from '@/components/npc/NPCWizard';
import CompletionScreen from '@/components/npc/CompletionScreen';
import QuickEncounter from '@/components/npc/QuickEncounter';
import InterviewChat from '@/components/agent/InterviewChat';
import { initialNPC } from '@/lib/npcFields';
import { generateFromPrompt, generateGenericSetting, loadCampaigns } from '@/lib/promptGeneration';
import { saveDefaultSnapshot } from '@/lib/npcReset';
import { loadDraft, saveDraft, clearDraft, hasDraftData } from '@/lib/npcDraft';
import { applyTemplateData } from '@/lib/npcTemplate';
import { arrayOf, isRecord, isString, stringValue } from '@/lib/runtimeTypes';

export default function CreateNPC(){
  const [params]=useSearchParams();
  const [choice,setChoice]=useState(()=>{
    if(params.get('duplicate'))return null;
    const d=loadDraft();
    console.log('[CreateNPC] restore draft:', { active_creator: d?.active_creator, hasNpc: !!(d?.npc), hasData: d?.npc ? hasDraftData(d.npc) : false, step: d?.step, mode: d?.npc?.mode });
    return(d&&d.active_creator&&d.npc&&hasDraftData(d.npc))?(d.npc.mode||'roleplay'):null;
  });
  const [npc,setNPC]=useState(()=>{
    const d=loadDraft();
    return(d&&d.npc&&hasDraftData(d.npc))?d.npc:initialNPC;
  });
  const [prompt,setPrompt]=useState(''),[templates,setTemplates]=useState([]),[busy,setBusy]=useState(false),[saved,setSaved]=useState(null),[campaigns,setCampaigns]=useState([]),[campaignId,setCampaignId]=useState('');

  // Refs to avoid stale closures in the beforeunload handler.
  const npcRef=useRef(npc),choiceRef=useRef(choice),savedRef=useRef(saved);
  npcRef.current=npc;choiceRef.current=choice;savedRef.current=saved;

  // Wrap setNPC so that the EXACT next NPC state is committed to the draft
  // immediately, inside the updater — no stale-closure gap between
  // setNPC and the effect that persists it.  This is the authoritative
  // immediate save for portrait_variants and all other NPC mutations.
  const setNPCWithSave=(updater)=>{
    setNPC((prev)=>{
      const next=typeof updater==='function'?updater(prev):updater;
      const draft=loadDraft()||{};
      const existingNpc=draft.npc||{};
      saveDraft({
        npc:{...existingNpc,...next},
        active_creator:hasDraftData(next)&&(next.mode==='combat'||next.mode==='roleplay'),
      });
      return next;
    });
  };

  // Debounced save as a safety net (covers any edge case the wrapper misses).
  useEffect(()=>{
    const isActive=!saved&&hasDraftData(npc)&&(choice==='combat'||choice==='roleplay');
    const t=setTimeout(()=>saveDraft({npc,active_creator:isActive}),250);
    return()=>clearTimeout(t);
  },[npc,choice,saved]);

  useEffect(()=>{
    const flush=()=>saveDraft({npc:npcRef.current,active_creator:!savedRef.current&&hasDraftData(npcRef.current)&&(choiceRef.current==='combat'||choiceRef.current==='roleplay')});
    window.addEventListener('beforeunload',flush);
    return()=>window.removeEventListener('beforeunload',flush);
  },[]);
  useEffect(()=>{const id=params.get('duplicate');if(id)base44.entities.NPC.get(id).then(x=>{const {id:_,created_date,updated_date,created_by_id,...copy}=x;clearDraft();setNPC({...copy,name:`${x.name} Copy`,archived:false});setChoice(copy.mode)});},[]);
  useEffect(()=>{loadCampaigns().then(setCampaigns);base44.entities.NPCTemplate.list('-created_date').then(setTemplates);},[]);
  const choose=async c=>{if(c==='quick')setChoice(c);else if(c==='auto')setChoice(c);else{clearDraft();setNPC({...initialNPC,mode:c});setChoice(c)}};
  const generate=async()=>{setBusy(true);try{const campaign=campaignId?await base44.entities.Campaign.get(campaignId):null;const data=await generateFromPrompt(prompt,campaign,{});const{sources,warnings,extracted,generated,...fields}=data;const next={...initialNPC,...fields,mode:'roleplay',faction:stringValue(fields.faction),campaign:stringValue(fields.campaign),original_creation_prompt:prompt,prompt_sources:isRecord(sources)?sources:{},prompt_meta:{warnings:arrayOf(warnings,isString),extracted:arrayOf(extracted,isString),generated:arrayOf(generated,isString)},campaign_id:campaign?.id||''};if(!next.faction)next.faction='Independent';if(!next.campaign)next.campaign=campaign?.name||generateGenericSetting(next);clearDraft();setNPC(next);setChoice('roleplay');}catch{}setBusy(false)};
  const useTemplate=(template)=>{const next=applyTemplateData(initialNPC,template?.npc_data);clearDraft();setNPC(next);setChoice(next.mode==='combat'?'combat':'roleplay');};
  const save=async()=>{setBusy(true);try{const s=await base44.entities.NPC.create(npc);const withBaseline=await saveDefaultSnapshot(s);clearDraft();setSaved(withBaseline);}catch{}setBusy(false)};
  const reset=()=>{clearDraft();setSaved(null);setChoice(null);setNPC(initialNPC);setPrompt('');};
  return (
    <div className="min-h-screen tavern-ambient">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {saved ? <CompletionScreen npc={saved} onCreateAnother={reset}/> : (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
            <main className="min-w-0">
              <div className="mb-6">
                {(choice!=='combat'&&choice!=='roleplay')&&<NavControls fallback="/library" className="mb-4"/>}
                <header className="border-b border-border/60 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-[.22em] text-brand/70">NPC Forge</p>
                  <h1 className="mt-2 font-fantasy text-3xl font-semibold sm:text-4xl">Character Contract</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A Guild Master sits at a tavern table with a blank contract, interviewing and imagining a new character.</p>
                </header>
              </div>
              {!choice ? <ModeChooser onChoose={choose}/> :
               choice==='template' ? <div><button onClick={()=>setChoice(null)} className="mb-4 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">← Back to choices</button><TemplatePicker templates={templates} onUseTemplate={useTemplate}/></div> :
               choice==='auto' ? <PromptBox prompt={prompt} setPrompt={setPrompt} generate={generate} busy={busy} campaigns={campaigns} campaignId={campaignId} setCampaignId={setCampaignId}/> :
               choice==='quick' ? <QuickEncounter setNPC={setNPCWithSave} onPromote={()=>{setNPCWithSave(p=>({...p,temporary:false}));setChoice('combat')}} onSave={save} saving={busy} campaigns={campaigns} campaignId={campaignId} setCampaignId={setCampaignId}/> :
               choice==='interview' ? <div><div className="mb-4"><button onClick={()=>setChoice(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">← Back to choices</button></div><InterviewChat/></div> :
               <NPCWizard npc={npc} setNPC={setNPCWithSave} onSave={save} saving={busy} onExit={()=>{clearDraft();setChoice(null)}}/>}
            </main>
            <aside className="hidden lg:block">
              <div className="sticky top-6 rounded-2xl border border-border bg-card/50 p-5">
                <h2 className="font-fantasy text-lg font-semibold">Character Summary</h2>
                {npc.name || npc.species || npc.sex_gender || npc.homeland || npc.culture ? (
                  <div className="mt-4 space-y-1">
                    {npc.name && <p className="font-fantasy text-base font-semibold">{npc.name}</p>}
                    <p className="text-xs text-muted-foreground">{[npc.species, npc.sex_gender, npc.pronouns?.replace('/', ' / ')].filter(Boolean).join(' · ')}</p>
                    {npc.age && <p className="text-xs text-muted-foreground">Age {npc.age}</p>}
                    {(npc.homeland || npc.culture) && <p className="text-xs text-muted-foreground">{[npc.homeland, npc.culture].filter(Boolean).join(' · ')}</p>}
                  </div>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    <div className="h-2.5 w-3/4 rounded-full bg-muted/60"/>
                    <div className="h-2.5 w-full rounded-full bg-muted/40"/>
                    <div className="h-2.5 w-5/6 rounded-full bg-muted/40"/>
                    <div className="h-2.5 w-2/3 rounded-full bg-muted/40"/>
                  </div>
                )}
                <p className="mt-4 text-xs leading-5 text-muted-foreground">A live summary of your character will appear here as you build.</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
function PromptBox({prompt,setPrompt,generate,busy,campaigns,campaignId,setCampaignId}){return <div className="rounded-2xl border border-border bg-card p-6"><h2 className="font-fantasy text-2xl">Describe the NPC</h2><textarea autoFocus rows={5} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Create Elias Thorne, an elderly human artificer who repairs pumps in a poor industrial district. He is kind but anxious, formerly served a merchant guild, and hides worsening tremors." className="mt-5 w-full rounded-xl border border-border bg-input p-4 outline-none focus:border-brand/50"/><div className="mt-4 flex flex-wrap items-center gap-3"><label className="text-xs text-muted-foreground">Campaign (optional)</label><select value={campaignId} onChange={e=>setCampaignId(e.target.value)} className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"><option value="">No campaign — generate generic setting</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><button disabled={!prompt.trim()||busy} onClick={generate} className="mt-4 rounded-lg bg-brand px-5 py-2.5 font-semibold text-brand-foreground disabled:opacity-40">{busy?'Forging character…':'Generate NPC'}</button></div>}
function TemplatePicker({templates,onUseTemplate}){return <div className="grid gap-4 sm:grid-cols-2">{templates.length?templates.map(t=><button key={t.id} onClick={()=>onUseTemplate(t)} className="rounded-2xl border border-border bg-card p-5 text-left hover:border-brand/40"><h3 className="font-fantasy text-xl">{t.name}</h3><p className="mt-2 text-sm text-muted-foreground">{t.description}</p></button>):<p className="text-muted-foreground">No templates yet. Create one from the Templates page.</p>}</div>}
