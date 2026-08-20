import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import NPCCard from '@/components/npc/NPCCard';
import LibraryFilters from '@/components/npc/LibraryFilters';
import NavControls from '@/components/NavControls';
export default function Library(){const [npcs,setNpcs]=useState([]),[filters,setFilters]=useState({});useEffect(()=>{base44.entities.NPC.list('-updated_date').then(setNpcs)},[]);const shown=useMemo(()=>npcs.filter(n=>!n.archived&&Object.entries(filters).every(([k,v])=>!v||String(n[k]||'').toLowerCase().includes(String(v).toLowerCase()))),[npcs,filters]);return <div className="p-5 sm:p-8"><NavControls/><PageHeader eyebrow="Character archive" title="NPC Library" description={`${shown.length} active characters`} action={<Link to="/create" className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground"><Plus size={16}/>Create NPC</Link>}/><LibraryFilters filters={filters} setFilters={setFilters}/>{shown.length?<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shown.map(n=><NPCCard key={n.id} npc={n}/>)}</div>:<div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">No NPCs match these filters.</div>}</div>}