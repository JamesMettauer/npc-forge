import { useState, useRef } from 'react';
import { Upload, Camera, Plus, X, ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { ACCEPT_STRING, isImageFile } from '@/lib/characterImport';

const VALID_EXTS = ['pdf', 'docx', 'jpg', 'jpeg', 'png', 'webp', 'heic'];

export default function SheetUploader({ onContinue, onBack, busy }){
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const cameraInput = useRef(null);

  const addFiles = (newFiles) => {
    const valid = [];
    for (const f of newFiles) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (VALID_EXTS.includes(ext) || f.type.startsWith('image/')) {
        valid.push(f);
        if (ext === 'heic') setError('HEIC may not be processable. Consider converting to JPG or PNG.');
      } else {
        setError(`${f.name}: unsupported file type`);
      }
    }
    setFiles(prev => [...prev, ...valid]);
    if (valid.length && !error.includes('HEIC')) setError('');
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); };
  const remove = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));
  const move = (idx, dir) => setFiles(prev => {
    const next = [...prev];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return prev;
    [next[idx], next[target]] = [next[target], next[idx]];
    return next;
  });

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragOver ? 'border-brand bg-brand/5' : 'border-border'}`}
      >
        <Upload size={28} className="mx-auto mb-2 text-muted-foreground"/>
        <p className="text-sm font-medium text-foreground">Drop a character sheet here</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, JPG, PNG, WEBP</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button onClick={() => fileInput.current?.click()} disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground disabled:opacity-40">Browse Files</button>
          <button onClick={() => cameraInput.current?.click()} disabled={busy} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground disabled:opacity-40"><Camera size={14}/>Take Photo</button>
        </div>
        <input ref={fileInput} type="file" accept={ACCEPT_STRING} multiple className="hidden" onChange={e => { addFiles(Array.from(e.target.files)); e.target.value = ''; }}/>
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={e => { addFiles(Array.from(e.target.files)); e.target.value = ''; }}/>
      </div>

      {error && <p className="text-xs text-amber-600 dark:text-amber-400">{error}</p>}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{files.length} page{files.length > 1 ? 's' : ''}</p>
          {files.map((f, i) => {
            const url = isImageFile(f) ? URL.createObjectURL(f) : null;
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
                {url ? <img src={url} alt={f.name} className="h-12 w-12 rounded object-cover"/> : <div className="flex h-12 w-12 items-center justify-center rounded bg-muted"><FileText size={20} className="text-muted-foreground"/></div>}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground">Page {i + 1}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp size={14}/></button>
                  <button onClick={() => move(i, 1)} disabled={i === files.length - 1} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown size={14}/></button>
                  <button onClick={() => remove(i)} className="rounded p-1 text-destructive"><X size={14}/></button>
                </div>
              </div>
            );
          })}
          <button onClick={() => fileInput.current?.click()} className="flex items-center gap-1.5 text-xs text-brand"><Plus size={14}/>Add Another Page</button>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => onContinue(files)} disabled={busy || files.length === 0} className="flex-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-40">{busy ? 'Analyzing…' : 'Continue'}</button>
        <button onClick={onBack} disabled={busy} className="rounded-lg border border-border px-4 py-2 text-sm">Back</button>
      </div>
    </div>
  );
}