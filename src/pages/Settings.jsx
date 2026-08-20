import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import NavControls from '@/components/NavControls';
import ThemePicker from '@/components/ThemePicker';

export default function Settings(){
  const [compact,setCompact]=useState(()=>localStorage.getItem('lorekeeper_compact')==='true');
  const toggle=()=>{setCompact(!compact);localStorage.setItem('lorekeeper_compact',String(!compact))};
  return <div className="max-w-3xl p-5 sm:p-8">
    <NavControls fallback="/"/>
    <PageHeader eyebrow="Workspace preferences" title="Settings"/>
    <section className="mb-6">
      <h2 className="mb-3 font-serif text-xl">Appearance</h2>
      <p className="mb-4 text-sm text-muted-foreground">Choose a theme. Your selection is saved to your profile and restored when you return.</p>
      <ThemePicker/>
    </section>
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div><h2 className="font-medium">Compact library cards</h2><p className="mt-1 text-sm text-muted-foreground">Keep larger collections easier to scan.</p></div>
        <button onClick={toggle} className={`h-7 w-12 rounded-full p-1 transition ${compact?'bg-brand':'bg-muted'}`}><span className={`block h-5 w-5 rounded-full bg-foreground transition ${compact?'translate-x-5':''}`}/></button>
      </div>
    </section>
  </div>;
}