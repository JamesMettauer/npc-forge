export default function FieldInput({field,value,onChange}){
 const [key,label,type,options]=field;
 const base='mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-brand/50';
 return <label className="block text-xs font-medium text-stone-400">{label}
  {type==='textarea'?<textarea rows={3} className={base} value={value||''} onChange={e=>onChange(key,e.target.value)}/>:type==='select'?<select className={base} value={value||''} onChange={e=>onChange(key,e.target.value)}><option value="">Choose…</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input className={base} type={type} value={value??''} onChange={e=>onChange(key,type==='number'?Number(e.target.value):e.target.value)}/>}</label>
}