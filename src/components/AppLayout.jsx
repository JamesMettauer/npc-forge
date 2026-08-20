import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, WandSparkles, Library, Map, MessagesSquare, ScrollText, Settings, Dices, Users } from 'lucide-react';
import ThemeQuickPicker from '@/components/ThemeQuickPicker';

const items = [['/','Dashboard',LayoutDashboard],['/create','Create NPC',WandSparkles],['/library','NPC Library',Library],['/player-characters','Player Characters',Users],['/campaigns','Campaigns',Map],['/conversations','Active Conversations',MessagesSquare],['/templates','Templates',ScrollText],['/settings','Settings',Settings]];

export default function AppLayout(){
  return <div className="min-h-screen bg-background text-foreground md:flex">
    <aside className="border-b border-border bg-sidebar md:fixed md:inset-y-0 md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-16 items-center gap-3 px-5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground"><Dices size={20}/></span><div><p className="font-serif text-lg font-semibold">Lorekeeper</p><p className="text-[10px] uppercase tracking-[.25em] text-brand/60">NPC Forge</p></div></div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:overflow-visible md:pb-0">{items.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive?'bg-brand/10 text-brand':'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon size={17}/><span>{label}</span></NavLink>)}</nav>
      <div className="px-3 pb-4 pt-2"><ThemeQuickPicker/></div>
    </aside>
    <main className="min-w-0 flex-1 md:ml-64"><Outlet/></main>
  </div>
}