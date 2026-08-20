import { Check } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { THEMES } from '@/lib/themes';

export default function ThemePicker(){
  const { theme, setTheme } = useTheme();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {THEMES.map(t => (
        <button key={t.id} onClick={() => setTheme(t.id)} className={`rounded-2xl border p-4 text-left transition ${theme===t.id?'border-brand bg-brand/5':'border-border hover:border-brand/40'}`}>
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {t.swatch.map((c,i) => <span key={i} className="h-6 w-6 rounded-full border border-border" style={{background:c}}/>)}
            </div>
            {theme===t.id && <Check size={16} className="text-brand"/>}
          </div>
          <p className="mt-3 font-serif text-lg">{t.name}</p>
        </button>
      ))}
    </div>
  );
}