import { useState } from 'react';
import { Image as ImageIcon, Upload, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { buildImageDescription } from '@/lib/appearance';

export default function PortraitTools({ npc, onChange }){
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange('portrait_url', file_url);
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    setBusy(true); setError('');
    try {
      const prompt = npc.image_prompt || buildImageDescription(npc) || npc.physical_description || npc.name;
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt
      });
      onChange('portrait_url', url);
    } catch (err) {
      setError('Portrait generation failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sm:col-span-2">
      <p className="mb-2 text-xs font-medium text-stone-400">Character portrait</p>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-input p-4 sm:flex-row sm:items-center">
        {npc.portrait_url ? (
          <Image src={npc.portrait_url} alt={`Portrait of ${npc.name || 'NPC'}`} className="h-32 w-32 rounded-xl"/>
        ) : (
          <div className="grid h-32 w-32 place-items-center rounded-xl bg-muted text-muted-foreground"><ImageIcon/></div>
        )}
        <div className="flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <Upload size={15}/>Upload
            <input type="file" accept="image/*" onChange={upload} className="hidden"/>
          </label>
          <button disabled={busy} onClick={generate} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-40">
            {busy ? 'Creating…' : 'Generate portrait'}
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive"><AlertCircle size={12}/>{error}</p>
      )}
    </div>
  );
}
