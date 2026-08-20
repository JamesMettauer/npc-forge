import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { THEMES } from '@/lib/themes';

export default function ThemeQuickPicker(){
  const { theme, setTheme } = useTheme();
  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="w-full" aria-label="Theme">
        <span className="flex items-center gap-2"><Palette size={16}/> <SelectValue/></span>
      </SelectTrigger>
      <SelectContent>
        {THEMES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}