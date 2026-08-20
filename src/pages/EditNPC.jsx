import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import NPCWizard from '@/components/npc/NPCWizard';
import NavControls from '@/components/NavControls';
export default function EditNPC(){const {id}=useParams(),nav=useNavigate(),[npc,setNpc]=useState(null),[saving,setSaving]=useState(false);useEffect(()=>{base44.entities.NPC.get(id).then(setNpc)},[id]);const save=async()=>{setSaving(true);await base44.entities.NPC.update(id,npc);nav(`/npc/${id}`)};return <div className="mx-auto max-w-5xl p-5 sm:p-8"><NavControls fallback="/library"/><PageHeader eyebrow="Character record" title={`Edit ${npc?.name||'NPC'}`}/>{npc?<NPCWizard npc={npc} setNPC={setNpc} onSave={save} saving={saving}/>:<p>Loading…</p>}</div>}