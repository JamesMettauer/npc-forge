import { DASHBOARD_THEMES } from '@/lib/dashboardThemes';

export default function DashboardThemePicker({ themeId, onChange }) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Dashboard theme">
      {DASHBOARD_THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          title={t.name}
          aria-label={t.name}
          aria-pressed={themeId === t.id}
          className={`h-7 w-7 rounded-full border-2 transition ${themeId === t.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
          style={{ background: t.accent }}
        />
      ))}
    </div>
  );
}