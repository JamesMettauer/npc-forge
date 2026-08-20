import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { arrayOf, isRecord, isString, numberValue, requireRecord, stringValue } from '@/lib/runtimeTypes';
import { AlertCircle, Save, LogOut } from 'lucide-react';
import Meters from '@/components/roleplay/Meters';
import DMPanel from '@/components/roleplay/DMPanel';
import ChatPanel from '@/components/roleplay/ChatPanel';
import SessionManager from '@/components/roleplay/SessionManager';
import PortraitStage from '@/components/roleplay/PortraitStage';
import ProfileUpdatesPanel from '@/components/roleplay/ProfileUpdatesPanel';
import ProfileHistory from '@/components/roleplay/ProfileHistory';
import { extractProfileUpdates, applyUpdateToNpc, undoHistoryEntry, autoApplyDecision, tagUpdates, dedupKey, isEmptyValue } from '@/lib/profileUpdates';
import { isSensitive } from '@/lib/profileFields';
import NavControls from '@/components/NavControls';
import ThemeQuickPicker from '@/components/ThemeQuickPicker';
import DicePanel from '@/components/roleplay/DicePanel';
import HiddenCheckEditor from '@/components/roleplay/HiddenCheckEditor';
import ConversationIntelligence from '@/components/roleplay/ConversationIntelligence';
import { generateCheckNarrative } from '@/lib/dice';
import { cleanPersonality } from '@/lib/personality';
import { resetConversationOnly, resetMoodRelationship, resetLearnedDetails, completeReset } from '@/lib/npcReset';
import { recalculateDCs, runFullIntelligenceUpdate, clearIntelligence as clearIntelLib } from '@/lib/conversationIntelligence';

const NPC_LLM_FIELDS = ['name','nicknames','pronouns','species','age','homeland','region','culture','class_name','subclass','level','alignment','occupation','faction','role','location','physical_description','clothing_equipment','distinguishing_features','personality_traits','ideals','bonds','flaws','likes_dislikes','fears','mannerisms','humor','temperament','social_behavior','speaking_style','vocabulary','accent','expressions','avoided_topics','backstory','relationships','goals','objectives','secrets','internal_conflicts','current_problems','party_stance_reasons','world_knowledge','party_relationship','initial_attitude','ally_status','observable_symptoms','hidden_condition','information_tiers','conditional_information','current_expression','current_pose','current_visible_equipment','current_background','current_lighting','current_injury','services','quests_rumors'];

const trimNpcForLLM = (npc) => {
  const out = {};
  for (const f of NPC_LLM_FIELDS) { const v = npc[f]; if (v != null && v !== '') out[f] = v; }
  return out;
};

const CONVO_LLM_FIELDS = ['name','scene','mood','attitude','objective','relationship_score','trust','fear','respect','hostility','learned_information','revealed_secrets','summary'];

const trimConvoForLLM = (convo) => {
  const out = {};
  for (const f of CONVO_LLM_FIELDS) { const v = convo[f]; if (v == null) continue; if (Array.isArray(v) && v.length === 0) continue; if (v === '') continue; out[f] = v; }
  return out;
};

const cleanCheckForResult = (c) => {
  const out = { ...c };
  if (out.final_dc == null) delete out.final_dc;
  if (out.base_dc == null) delete out.base_dc;
  if (out.opposed_result == null) delete out.opposed_result;
  return out;
};

export default function Roleplay(){
  const {npcId}=useParams();
  const [npc,setNpc]=useState(null),[loadError,setLoadError]=useState(false),[loadErrorDetail,setLoadErrorDetail]=useState('');
  const [sessions,setSessions]=useState([]),[convo,setConvo]=useState(null);
  const [messages,setMessages]=useState([]),[busy,setBusy]=useState(false),[sendError,setSendError]=useState(false),[sendErrorDetail,setSendErrorDetail]=useState(''),[savedFlash,setSavedFlash]=useState(false),[profileNote,setProfileNote]=useState(''),[composerText,setComposerText]=useState(''),[diceOpen,setDiceOpen]=useState(false),[diceSkill,setDiceSkill]=useState('Medicine'),[intelBusy,setIntelBusy]=useState(false);

  const loadNpc=async()=>{
    setLoadError(false);setLoadErrorDetail('');setNpc(null);
    let n;
    try{ n=await base44.entities.NPC.get(npcId); setNpc(n); }
    catch(e){ setLoadError(true); setLoadErrorDetail(e?.message||String(e)||'Unknown error'); return; }
    // NPC loaded — conversation setup is decoupled so a session error never masks the character.
    try{
      const list=await base44.entities.Conversation.filter({npc_id:npcId},'-created_date');
      setSessions(list);
      if(list.length){const c=list[0];setConvo(c);setMessages(await base44.entities.Message.filter({conversation_id:c.id},'created_date'));}
      else{const c=await base44.entities.Conversation.create({npc_id:npcId,npc_name:n.name,name:'Session 1',scene:n.location||'',mood:n.temperament||'guarded',attitude:n.initial_attitude||'neutral',objective:n.objectives||'',learned_information:[],revealed_secrets:[]});setSessions([c]);setConvo(c);setMessages([]);}
    }catch(e){
      setSessions([]);setConvo(null);setMessages([]);
      setProfileNote(`Could not load conversation history (${e?.message||'error'}). Try starting a new conversation.`);setTimeout(()=>setProfileNote(''),6000);
    }
  };
  useEffect(()=>{loadNpc()},[npcId]);
  useEffect(()=>{if(!convo||!npc)return;if(!convo.intelligence||!convo.intelligence.dcBreakdowns){const newIntel=recalculateDCs(convo,npc);base44.entities.Conversation.update(convo.id,{intelligence:newIntel}).then(()=>setConvo(c=>c?.id===convo.id?{...c,intelligence:newIntel}:c)).catch(()=>{});}},[convo?.id,npc?.id,convo?.intelligence?.dcBreakdowns]);

  const refreshSessions=async()=>{const list=await base44.entities.Conversation.filter({npc_id:npcId},'-created_date');setSessions(list);return list;};
  const selectSession=async sid=>{const c=sessions.find(s=>s.id===sid);setConvo(c);setMessages(await base44.entities.Message.filter({conversation_id:sid},'created_date'));};
  const newSession=async()=>{const c=await base44.entities.Conversation.create({npc_id:npcId,npc_name:npc.name,name:`Session ${sessions.length+1}`,scene:npc.location||'',mood:npc.temperament||'guarded',attitude:npc.initial_attitude||'neutral',objective:npc.objectives||'',learned_information:[],revealed_secrets:[]});await refreshSessions();setConvo(c);setMessages([]);};
  const renameSession=async(sid,name)=>{await base44.entities.Conversation.update(sid,{name});const list=await refreshSessions();if(convo?.id===sid)setConvo(list.find(s=>s.id===sid));};
  const deleteSession=async sid=>{await base44.entities.Message.deleteMany({conversation_id:sid});await base44.entities.Conversation.delete(sid);const list=await refreshSessions();if(convo?.id===sid){if(list.length)selectSession(list[0].id);else{setConvo(null);setMessages([]);}}};
  const resetSession=async()=>{await base44.entities.Message.deleteMany({conversation_id:convo.id});const u=await base44.entities.Conversation.update(convo.id,{learned_information:[],revealed_secrets:[],pending_updates:[],rejected_updates:[],check_results:[],summary:'',mood:'neutral',attitude:'neutral',scene:'',objective:'',relationship_score:0,trust:20,fear:0,respect:10,hostility:0,intelligence:{}});setConvo(u);setMessages([]);};
  const saveSession=async()=>{await base44.entities.Conversation.update(convo.id,convo);setSavedFlash(true);setTimeout(()=>setSavedFlash(false),2000);};
  const summarize=async()=>{setBusy(true);try{const summary=await base44.integrations.Core.InvokeLLM({prompt:`Summarize this NPC interaction into concise campaign notes: ${messages.map(m=>`${m.role}: ${m.content}`).join('\n')}`});const updated=await base44.entities.Conversation.update(convo.id,{summary});setConvo(updated);}catch{}setBusy(false);};
  const apply=()=>base44.entities.Conversation.update(convo.id,convo).then(c=>{setConvo(c);refreshDCs(c);});
const updateIntel=(partial)=>{if(!convo)return;const merged={...(convo.intelligence||{}),...partial};const newIntel=recalculateDCs({...convo,intelligence:merged},npc);base44.entities.Conversation.update(convo.id,{intelligence:newIntel}).then(()=>setConvo(c=>c?.id===convo.id?{...c,intelligence:newIntel}:c)).catch(()=>{});};
const refreshDCs=(cArg)=>{const c=cArg||convo;if(!c||!npc)return;const newIntel=recalculateDCs(c,npc);base44.entities.Conversation.update(c.id,{intelligence:newIntel}).then(()=>setConvo(cur=>cur?.id===c.id?{...cur,intelligence:newIntel}:cur)).catch(()=>{});};
const handleRegenerateIntel=async()=>{if(!convo||!npc)return;setIntelBusy(true);const recent=messages.slice(-6).map(m=>`${m.role}: ${m.content}`).join('\n');await runFullIntelligenceUpdate(npc,convo,recent,(intel)=>setConvo(c=>c?.id===convo.id?{...c,intelligence:intel}:c));setIntelBusy(false);};
const handleClearIntel=()=>{if(!convo||!npc)return;const newIntel=clearIntelLib(convo,npc);base44.entities.Conversation.update(convo.id,{intelligence:newIntel}).then(()=>setConvo(c=>c?.id===convo.id?{...c,intelligence:newIntel}:c)).catch(()=>{});};
const resetIntelFor=(c,mode='clear')=>{if(!c||!npc)return;let newIntel;if(mode==='clear'){newIntel=clearIntelLib(c,npc);}else{const intel=c.intelligence||{};newIntel={...intel,observableSymptoms:(intel.observableSymptoms||[]).filter(s=>!s.temporary),hiddenConditions:(intel.hiddenConditions||[]).filter(cc=>cc.status!=='Temporary Condition')};newIntel=recalculateDCs({...c,intelligence:newIntel},npc);}base44.entities.Conversation.update(c.id,{intelligence:newIntel}).then(()=>setConvo(cur=>cur?.id===c.id?{...cur,intelligence:newIntel}:cur)).catch(()=>{});};

  const runExtraction=async(currentConvo,exchange)=>{
    const mode=currentConvo.profile_update_mode||'auto_fill';
    if(mode==='disabled')return;
    let raw;try{raw=await extractProfileUpdates(npc,exchange);}catch{raw=null;}
    if(raw===null){setProfileNote('NPC details could not be updated from this exchange.');setTimeout(()=>setProfileNote(''),4000);return;}
    if(!raw||!raw.length)return;
    const source=exchange.split('\n').slice(0,2).join(' · ');
    const tagged=tagUpdates(raw,source);
    const existingKeys=new Set([...(currentConvo.pending_updates||[]),...(currentConvo.rejected_updates||[])].map(dedupKey));
    const fresh=tagged.filter(u=>!existingKeys.has(dedupKey(u)));
    if(!fresh.length)return;
    const auto=[],remain=[];
    for(const u of fresh){if(autoApplyDecision(u,mode)==='apply')auto.push(u);else remain.push(u);}
    let npcNext=npc;const notes=[];
    for(const u of auto){try{const r=await applyUpdateToNpc(npcNext,u,'auto');npcNext=r.npc;notes.push(`${u.field_label||u.field}: ${u.proposed_value}`);}catch{}}
    if(npcNext!==npc)setNpc(npcNext);
    const newPending=[...(currentConvo.pending_updates||[]),...remain];
    try{await base44.entities.Conversation.update(currentConvo.id,{pending_updates:newPending});setConvo(c=>c&&c.id===currentConvo.id?{...c,pending_updates:newPending}:c);}catch{}
    if(notes.length){setProfileNote(`Profile updated from conversation: ${notes.join('; ')}`);setTimeout(()=>setProfileNote(''),4000);}
  };
  const updateMode=async(mode)=>{try{const u=await base44.entities.Conversation.update(convo.id,{profile_update_mode:mode});setConvo(u);}catch{}};
  const acceptUpdate=async(update)=>{try{const r=await applyUpdateToNpc(npc,update,'DM');setNpc(r.npc);const np=(convo.pending_updates||[]).filter(u=>u.id!==update.id);const u=await base44.entities.Conversation.update(convo.id,{pending_updates:np});setConvo(u);setProfileNote(`${update.field_label||update.field} updated from conversation.`);setTimeout(()=>setProfileNote(''),3000);}catch{}};
  const rejectUpdate=async(id)=>{const u=(convo.pending_updates||[]).find(x=>x.id===id);const np=(convo.pending_updates||[]).filter(x=>x.id!==id);const rej=[...(convo.rejected_updates||[]),...(u?[{field:u.field,proposed_value:u.proposed_value}]:[])];try{const u2=await base44.entities.Conversation.update(convo.id,{pending_updates:np,rejected_updates:rej});setConvo(u2);}catch{}};
  const editUpdate=async(id,val)=>{const np=(convo.pending_updates||[]).map(u=>u.id===id?{...u,proposed_value:val}:u);try{const u=await base44.entities.Conversation.update(convo.id,{pending_updates:np});setConvo(u);}catch{}};
  const applyTemporary=async(update)=>{const note=`[Temporary] ${update.field_label||update.field}: ${update.proposed_value}`;const li=[...(convo.learned_information||[]),note];const np=(convo.pending_updates||[]).filter(u=>u.id!==update.id);try{const u=await base44.entities.Conversation.update(convo.id,{pending_updates:np,learned_information:li});setConvo(u);}catch{}};
  const saveNote=async(update)=>{const note=`${update.field_label||update.field}: ${update.proposed_value}`;const li=[...(convo.learned_information||[]),note];const np=(convo.pending_updates||[]).filter(u=>u.id!==update.id);try{const u=await base44.entities.Conversation.update(convo.id,{pending_updates:np,learned_information:li});setConvo(u);}catch{}};
  const applyAllSafe=async()=>{const pending=(convo.pending_updates||[]).filter(u=>u.status==='pending');let npcNext=npc;const applied=[];for(const u of pending){if(autoApplyDecision(u,'auto_safe')==='apply'){try{const r=await applyUpdateToNpc(npcNext,u,'DM');npcNext=r.npc;applied.push(u.id);}catch{}}};if(npcNext!==npc)setNpc(npcNext);const np=pending.filter(u=>!applied.includes(u.id));try{const u=await base44.entities.Conversation.update(convo.id,{pending_updates:np});setConvo(u);}catch{}};
  const rejectAll=async()=>{const pending=(convo.pending_updates||[]).filter(u=>u.status==='pending');const rej=[...(convo.rejected_updates||[]),...pending.map(u=>({field:u.field,proposed_value:u.proposed_value}))];try{const u=await base44.entities.Conversation.update(convo.id,{pending_updates:[],rejected_updates:rej});setConvo(u);}catch{}};
  const undoHistory=async(entryId)=>{try{const u=await undoHistoryEntry(npc,entryId);setNpc(u);}catch{}};

  const send=async(text,opts={})=>{
    const {isRegen=false,kind='dialogue',checkResult=null}=opts;
    setBusy(true);setSendError(false);setSendErrorDetail('');
    let user;
    const playerRoll=checkResult&&(checkResult.final_dc!=null||checkResult.opposed_result)?{skill:checkResult.skill,total:checkResult.total,dc:checkResult.opposed_result?0:checkResult.final_dc,success:checkResult.opposed_result?checkResult.opposed_result.won:checkResult.total>=checkResult.final_dc,character:checkResult.character,...(checkResult.opposed_result?{opposed:{skill:checkResult.opposed_result.skill,total:checkResult.opposed_result.total}}:{})}:undefined;
    if(!isRegen){user=await base44.entities.Message.create({conversation_id:convo.id,role:'user',content:text,kind,player_roll:playerRoll});setMessages(m=>[...m,user]);}
    else{user=messages.filter(m=>m.role==='user').pop();}
    try{
      const contextMsgs=isRegen?messages:[...messages,user];
      const recent=contextMsgs.slice(-12).map(m=>`${m.role}: ${m.content}`).join('\n');
      const checkSc=checkResult?.social_changes||{};
      const checkScText=Object.values(checkSc).some(v=>v)?` Social shifts being applied: ${Object.entries(checkSc).filter(([,v])=>v).map(([k,v])=>`${k} ${v>=0?'+':''}${v}`).join(', ')}.`:'';
      const checkCtx=checkResult?`\nPLAYER CHECK — REQUIRED CONTEXT: ${checkResult.skill} check by ${checkResult.character||'a party member'} — total ${checkResult.total}${checkResult.final_dc?` vs DC ${checkResult.final_dc}`:''} → ${checkResult.degree_label}. What the player learned: ${(checkResult.revealed_to_player||checkResult.findings||[]).join('; ')}. ${checkResult.npc_reaction?`The NPC notices: ${checkResult.npc_reaction}`:'The NPC does not notice the attempt.'}${checkScText} The NPC's awareness, actions, emotional tone, and dialogue MUST be consistent with this outcome and the social shifts above. A successful check reveals what the acting character learns — it does NOT force the NPC to reveal secrets or change their mind unless the skill and outcome warrant it.\n`:'';
      const rawResult=await base44.integrations.Core.InvokeLLM({
        prompt:`Roleplay as this D&D NPC. Stay in character. Never reveal secrets or conditional information unless trust, motivations, circumstances, and the player's approach justify it. The DM sees thoughts, the player does not.\nNPC: ${JSON.stringify(trimNpcForLLM(npc))}\nScene state: ${JSON.stringify(trimConvoForLLM(convo))}\nConversation:\n${recent}${checkCtx}\nReturn dialogue (the NPC's spoken words), action (physical actions, gestures, or narration of what the NPC does — empty string if none), private internal thoughts, updated social metrics (0-100 except relationship -100 to 100), any newly learned public information, and only secrets actually revealed in the spoken response. When a player check is provided it is required: shape the NPC's awareness and reaction to match the outcome.`,
        response_json_schema:{type:'object',properties:{dialogue:{type:'string'},action:{type:'string'},thoughts:{type:'string'},relationship_score:{type:'number'},trust:{type:'number'},fear:{type:'number'},respect:{type:'number'},hostility:{type:'number'},learned_information:{type:'array',items:{type:'string'}},revealed_secrets:{type:'array',items:{type:'string'}}},required:['dialogue','thoughts']}
      });
      const response=requireRecord(rawResult,'Roleplay response');
      const result={
        dialogue:stringValue(response.dialogue)||stringValue(response.response),
        action:stringValue(response.action),thoughts:stringValue(response.thoughts),
        relationship_score:numberValue(response.relationship_score,convo.relationship_score||0),
        trust:numberValue(response.trust,convo.trust||20),fear:numberValue(response.fear,convo.fear||0),
        respect:numberValue(response.respect,convo.respect||10),hostility:numberValue(response.hostility,convo.hostility||0),
        learned_information:arrayOf(response.learned_information,isString),
        revealed_secrets:arrayOf(response.revealed_secrets,isString),
      };
      const dialogue=result.dialogue;
      const reply=await base44.entities.Message.create({conversation_id:convo.id,role:'npc',content:dialogue,action:result.action,thoughts:result.thoughts});
      const sc=checkResult?.social_changes||{};
      const clampN=(n,lo=0,hi=100)=>Math.max(lo,Math.min(hi,n));
      const bT=result.trust!=null?result.trust:convo.trust,bF=result.fear!=null?result.fear:convo.fear,bR=result.respect!=null?result.respect:convo.respect,bH=result.hostility!=null?result.hostility:convo.hostility;
      const updated={...convo,relationship_score:result.relationship_score!=null?result.relationship_score:convo.relationship_score,trust:clampN(bT+(sc.trust||0)),fear:clampN(bF+(sc.fear||0)),respect:clampN(bR+(sc.respect||0)),hostility:clampN(bH+(sc.hostility||0)),learned_information:[...(convo.learned_information||[]),...(checkResult?(checkResult.findings||[]).map(f=>`[${checkResult.skill}] ${f}`):[]),...(result.learned_information||[])],revealed_secrets:[...(convo.revealed_secrets||[]),...(result.revealed_secrets||[])],check_results:checkResult?[...(convo.check_results||[]),cleanCheckForResult({...checkResult,id:`${Date.now()}`,exchange_id:user?.id||null,applied:true,timestamp:new Date().toISOString()})]:(convo.check_results||[]),summary:convo.summary};
      delete updated.dialogue;delete updated.action;delete updated.response;delete updated.thoughts;
      const updatePayload={relationship_score:updated.relationship_score,trust:updated.trust,fear:updated.fear,respect:updated.respect,hostility:updated.hostility,learned_information:updated.learned_information,revealed_secrets:updated.revealed_secrets,check_results:updated.check_results,summary:updated.summary};
      await base44.entities.Conversation.update(convo.id,updatePayload);
      setConvo(updated);setMessages(m=>[...m,reply]);
      runExtraction(updated,`Player: ${user.content}\nNPC: ${dialogue}`);
      const recentIntel=contextMsgs.slice(-6).map(m=>`${m.role}: ${m.content}`).join('\n');
      runFullIntelligenceUpdate(npc,updated,recentIntel,(intel)=>setConvo(c=>c?.id===updated.id?{...c,intelligence:intel}:c));
    }catch(e){console.error('NPC send error:',e);setSendError(true);setSendErrorDetail(e?.message||String(e));}
    setBusy(false);
  };
  const regenerate=()=>{const lastUser=messages.filter(m=>m.role==='user').pop();if(lastUser)send(lastUser.content,{isRegen:true});};
  const latestUserMsg=messages.filter(m=>m.role==='user').pop();
  const openDice=(skill)=>{setDiceSkill(skill||'Medicine');setDiceOpen(true);};
  const onRollResult=async(result)=>{
    setDiceOpen(false);setBusy(true);
    const recent=messages.slice(-8).map(m=>`${m.role}: ${m.content}`).join('\n');
    let narrative=null;
    try{narrative=await generateCheckNarrative({npc,convo,skill:result.skill,total:result.total,dc:result.final_dc,degree:{degree:result.degree,label:result.degree_label},character:result.character,recentContext:recent});}catch{narrative=null;}
    const narrativeData=isRecord(narrative)?narrative:{};
    const nr={...result,id:`${Date.now()}`,exchange_id:latestUserMsg?.id||null,timestamp:new Date().toISOString(),applied:false,findings:arrayOf(narrativeData.findings,isString),revealed_to_player:arrayOf(narrativeData.revealedToPlayer,isString),npc_reaction:stringValue(narrativeData.npcReaction),social_changes:isRecord(narrativeData.socialChanges)?narrativeData.socialChanges:{}};
    const cr=[...(convo.check_results||[]),nr];
    try{const u=await base44.entities.Conversation.update(convo.id,{check_results:cr});setConvo(u);}catch{}
    setBusy(false);
  };
  const onFollowUp=(text)=>{setComposerText(text);};
  const onAddNote=(items)=>{const li=[...(convo.learned_information||[]),...items.map(i=>`[Note] ${i}`)];base44.entities.Conversation.update(convo.id,{learned_information:li}).then(setConvo).catch(()=>{});};
  const clamp=(n,lo=0,hi=100)=>Math.max(lo,Math.min(hi,n));
  const onApplyResult=async(result)=>{
    if(result.applied)return;setBusy(true);
    let reactionId=null;
    if(result.npc_reaction){try{const msg=await base44.entities.Message.create({conversation_id:convo.id,role:'npc',content:result.npc_reaction,thoughts:`[Reaction to ${result.skill} check]`});reactionId=msg.id;setMessages(m=>[...m,msg]);}catch{}}
    const li=[...(convo.learned_information||[]),...(result.findings||[]).map(f=>`[${result.skill}] ${f}`)];
    const sc=result.social_changes||{};
    const trust=clamp((convo.trust||0)+(sc.trust||0));const fear=clamp((convo.fear||0)+(sc.fear||0));const respect=clamp((convo.respect||0)+(sc.respect||0));const hostility=clamp((convo.hostility||0)+(sc.hostility||0));
    const cr=(convo.check_results||[]).map(r=>r.id===result.id?{...r,applied:true,reaction_message_id:reactionId}:r);
    try{const u=await base44.entities.Conversation.update(convo.id,{check_results:cr,learned_information:li,trust,fear,respect,hostility});setConvo(u);refreshDCs(u);}catch{}
    setBusy(false);
  };
  const onUndoApply=async(result)=>{const sc=result.social_changes||{};const trust=clamp((convo.trust||0)-(sc.trust||0));const fear=clamp((convo.fear||0)-(sc.fear||0));const respect=clamp((convo.respect||0)-(sc.respect||0));const hostility=clamp((convo.hostility||0)-(sc.hostility||0));const toRemove=new Set((result.findings||[]).map(f=>`[${result.skill}] ${f}`));const li=(convo.learned_information||[]).filter(x=>!toRemove.has(x));const cr=(convo.check_results||[]).map(r=>r.id===result.id?{...r,applied:false}:r);if(result.reaction_message_id){try{await base44.entities.Message.delete(result.reaction_message_id);setMessages(m=>m.filter(x=>x.id!==result.reaction_message_id));}catch{}}try{const u=await base44.entities.Conversation.update(convo.id,{check_results:cr,learned_information:li,trust,fear,respect,hostility});setConvo(u);refreshDCs(u);}catch{}};
  const cleanProfile=async()=>{const{npc:cleaned,backup}=cleanPersonality(npc);const changed=Object.keys(backup);if(!changed.length){setProfileNote('No duplicate personality entries found.');setTimeout(()=>setProfileNote(''),3000);return;}const update={};for(const f of changed)update[f]=cleaned[f];try{const u=await base44.entities.NPC.update(npc.id,{...update,profile_backups:[...(npc.profile_backups||[]),{id:`${Date.now()}`,date:new Date().toISOString(),scope:'personality',by:'DM',snapshot:backup}]});setNpc(u);setProfileNote('Personality duplicates cleaned. Original saved as backup.');setTimeout(()=>setProfileNote(''),4000);}catch{setProfileNote('Could not clean personality data.');setTimeout(()=>setProfileNote(''),3000);}};
  const reloadConvo=async()=>{if(!convo)return null;const c=await base44.entities.Conversation.get(convo.id);setConvo(c);setMessages(await base44.entities.Message.filter({conversation_id:c.id},'created_date'));return c;};
  const clearConversation=async()=>{try{await resetConversationOnly(convo.id);const c=await reloadConvo();resetIntelFor(c,'clear');setProfileNote('Current conversation cleared. NPC profile preserved.');setTimeout(()=>setProfileNote(''),3000);}catch{setProfileNote('Could not clear conversation.');setTimeout(()=>setProfileNote(''),3000);}};
  const resetEmotional=async()=>{try{await resetMoodRelationship(npc);const c=await reloadConvo();resetIntelFor(c,'tempOnly');setProfileNote('Emotional state reset to defaults.');setTimeout(()=>setProfileNote(''),3000);}catch{}};
  const clearIntelligence=async()=>{try{await resetLearnedDetails(npc);const c=await reloadConvo();resetIntelFor(c,'clear');setProfileNote('Session intelligence cleared.');setTimeout(()=>setProfileNote(''),3000);}catch{}};
  const discardPending=async()=>{try{const u=await base44.entities.Conversation.update(convo.id,{pending_updates:[],rejected_updates:[]});setConvo(u);setProfileNote('Pending updates discarded.');setTimeout(()=>setProfileNote(''),3000);}catch{}};
  const fullReset=async()=>{try{const u=await completeReset(npc);setNpc(u);const c=await reloadConvo();resetIntelFor(c,'clear');setProfileNote('NPC reset to Default State Baseline. No previous conversation remains.');setTimeout(()=>setProfileNote(''),4000);}catch{setProfileNote('No Default State Baseline found. Complete character creation first.');setTimeout(()=>setProfileNote(''),4000);}};
  const endConversation=async()=>{
    setBusy(true);
    try{
      let npcNext=npc;const pending=(convo.pending_updates||[]).filter(u=>u.status==='pending');const applied=[];
      for(const u of pending){if(!isSensitive(u.field)&&['confirmed_fact','likely_fact'].includes(u.classification)&&isEmptyValue(u.current_value)){try{const r=await applyUpdateToNpc(npcNext,u,'DM');npcNext=r.npc;applied.push(u.id);}catch{}}}
      if(npcNext!==npc)setNpc(npcNext);
      let summary=convo.summary||'';
      if(messages.length){try{summary=await base44.integrations.Core.InvokeLLM({prompt:`Summarize this NPC interaction into concise campaign notes: ${messages.map(m=>`${m.role}: ${m.content}`).join('\n')}`});}catch{}}
      const np=(convo.pending_updates||[]).filter(u=>!applied.includes(u.id));
      await base44.entities.Conversation.update(convo.id,{active:false,summary,check_results:[],pending_updates:np});
      await refreshSessions();
      setProfileNote('Conversation ended. Learned details locked in.');
      setTimeout(()=>setProfileNote(''),4000);
      await newSession();
    }catch{setProfileNote('Could not end the conversation.');setTimeout(()=>setProfileNote(''),3000);}
    setBusy(false);
  };
  if(loadError)return <div className="p-5 sm:p-8"><NavControls fallback="/library"/><div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center"><AlertCircle className="mx-auto mb-4 text-destructive" size={32}/><p className="text-foreground">Unable to load this NPC. Please return to the NPC profile and try again.</p>{loadErrorDetail&&<p className="mx-auto mt-3 max-w-md break-words rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{loadErrorDetail}</p>}<div className="mt-6 flex flex-wrap justify-center gap-3"><button onClick={loadNpc} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">Retry</button><Link to={`/npc/${npcId}`} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground">Return to NPC Profile</Link><Link to="/library" className="rounded-lg border border-border px-4 py-2 text-sm text-foreground">Return to NPC Library</Link></div></div></div>;
  if(!npc)return <div className="p-8 text-muted-foreground">Loading NPC…</div>;

  return <div>
    <div className="border-b border-border p-4 flex items-center justify-between"><NavControls fallback="/library" className=""/><ThemeQuickPicker/></div>
    <div className="lg:flex">
      <main className="flex-1 border-r border-border">
        <header className="border-b border-border"><PortraitStage npc={npc} convo={convo} busy={busy}/></header>
        {convo?<ChatPanel messages={messages} onSend={send} busy={busy} npcName={npc.name} error={sendError} errorDetail={sendErrorDetail} onRegenerate={regenerate} text={composerText} onText={setComposerText} onOpenNpcCheck={()=>openDice()} npc={npc} convo={convo} allChecks={convo.check_results||[]} onApply={onApplyResult} onUndoApply={onUndoApply} onFollowUp={onFollowUp} onAddNote={onAddNote}/>:<div className="grid place-items-center p-12 text-center"><p className="text-muted-foreground">No conversation selected.</p><button onClick={newSession} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">Start new conversation</button></div>}
      </main>
      <aside className="w-full space-y-6 p-5 lg:w-[340px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <SessionManager sessions={sessions} currentId={convo?.id} onSelect={selectSession} onNew={newSession} onRename={renameSession} onDelete={deleteSession}/>
        {convo&&<>
        <section><h2 className="mb-4 font-serif text-lg">Social state</h2><Meters conversation={convo}/></section>
        <section><h2 className="mb-3 font-serif text-lg">DM control panel</h2><DMPanel conversation={convo} setConversation={setConvo} onApply={apply}/></section>
        <ConversationIntelligence convo={convo} npc={npc} onUpdateIntel={updateIntel} onRegenerate={handleRegenerateIntel} busy={intelBusy}/>
        <ProfileUpdatesPanel convo={convo} onModeChange={updateMode} onAccept={acceptUpdate} onReject={rejectUpdate} onEdit={editUpdate} onTemporary={applyTemporary} onNote={saveNote} onApplyAllSafe={applyAllSafe} onRejectAll={rejectAll}/>
        <ProfileHistory npc={npc} onUndo={undoHistory} onClean={cleanProfile}/>
        <HiddenCheckEditor convo={convo} npc={npc} onUpdateIntel={updateIntel} onRegenerate={handleRegenerateIntel} onClear={handleClearIntel} busy={intelBusy}/>
        {(convo.check_results||[]).length>0&&<section className="text-sm"><h2 className="mb-2 font-serif text-lg">Check results</h2><div className="space-y-1.5">{convo.check_results.slice().reverse().map(r=><div key={r.id} className="rounded-lg border border-border p-2 text-xs"><span className="font-medium text-foreground">{r.skill}</span> <span className="text-muted-foreground">— {r.character} — {r.total}</span></div>)}</div></section>}
        {profileNote&&<p className="rounded-lg bg-brand/10 p-2 text-xs text-brand">{profileNote}</p>}
        <section className="text-sm"><h2 className="mb-2 font-serif text-lg">Session controls</h2><p className="mb-2 text-xs text-muted-foreground">These affect only roleplay session state. The NPC's permanent profile, portrait, voice, and locked traits remain intact.</p>
          <button onClick={endConversation} disabled={busy} className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground disabled:opacity-40"><LogOut size={12}/>End the Conversation</button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={clearConversation} disabled={busy} className="rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-40">Clear Current Conversation</button>
            <button onClick={newSession} disabled={busy} className="rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-40">Start New Conversation</button>
            <button onClick={resetEmotional} disabled={busy} className="rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-40">Reset Emotional State</button>
            <button onClick={clearIntelligence} disabled={busy} className="rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-40">Clear Session Intelligence</button>
            <button onClick={discardPending} disabled={busy} className="rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-40">Discard Pending Updates</button>
            <button onClick={fullReset} disabled={busy} className="rounded-lg border border-destructive/40 px-3 py-2 text-xs text-destructive disabled:opacity-40">Complete Reset to Default</button>
          </div>
        </section>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={summarize} disabled={busy||!messages.length} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground disabled:opacity-40">Convert to notes</button>
          <button onClick={resetSession} disabled={busy||!messages.length} className="rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-40">Reset chat</button>
          <button onClick={saveSession} disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-40"><Save size={12}/>{savedFlash?'Saved!':'Save conversation'}</button>
        </div></>}
      </aside>
    </div>
    <DicePanel open={diceOpen} onOpenChange={setDiceOpen} npc={npc} prefillSkill={diceSkill} onResult={onRollResult} latestExchangeId={latestUserMsg?.id||null}/>
  </div>;
}
