import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, FileText, Camera, PenLine, Zap, Image as ImageIcon, FileType } from 'lucide-react';
import SheetUploader from './SheetUploader';
import ImportReview from './ImportReview';
import ManualEntryForm from './ManualEntryForm';
import { extractFromFiles, uploadFiles, computeRoleplaySummary } from '@/lib/characterImport';

const METHODS = [
  { key: 'pdf', label: 'Upload PDF', icon: FileType, desc: 'D&D Beyond, form-fillable, or custom PDF' },
  { key: 'word', label: 'Upload Word Document', icon: FileText, desc: 'DOCX character sheet' },
  { key: 'photo', label: 'Upload Photo / Scan', icon: ImageIcon, desc: 'JPG, PNG, WEBP' },
  { key: 'take_photo', label: 'Take Photo', icon: Camera, desc: 'Photograph a physical sheet' },
  { key: 'manual', label: 'Create Manually', icon: PenLine, desc: 'Enter character details by hand' },
  { key: 'quick', label: 'Quick Import', icon: Zap, desc: 'Just the essentials for roleplay' },
];

export default function ImportWizard({ existingCharacter, campaignId, campaignName, onSaved, onClose }){
  const [step, setStep] = useState(existingCharacter ? 'upload' : 'method');
  const [method, setMethod] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isUpdate = !!existingCharacter;

  const pickMethod = (m) => {
    setMethod(m);
    setError('');
    if (m === 'manual' || m === 'quick') setStep('manual');
    else setStep('upload');
  };

  const handleUpload = async (selectedFiles) => {
    setBusy(true);
    setError('');
    setStep('extracting');
    try {
      const urls = await uploadFiles(selectedFiles);
      const data = await extractFromFiles(urls, { quickMode: method === 'quick' });
      data.source_file_url = urls[0];
      data.source_file_name = selectedFiles.map(f => f.name).join(', ');
      data.source_file_pages = urls;
      data.import_method = method;
      data.upload_date = new Date().toISOString();
      if (isUpdate) data.sheet_version = (existingCharacter.sheet_version || 1) + 1;
      setExtracted(data);
      setStep('review');
    } catch (e) {
      setError(e?.message || 'Could not extract character data. You can enter the details manually.');
      setExtracted(null);
      setStep('manual');
    }
    setBusy(false);
  };

  const handleSave = async (data) => {
    setBusy(true);
    setError('');
    try {
      const finalData = {
        ...data,
        roleplay_summary: computeRoleplaySummary(data),
        campaign_id: campaignId || data.campaign_id,
        campaign: campaignName || data.campaign,
      };
      if (isUpdate) {
        await base44.entities.PlayerCharacter.update(existingCharacter.id, finalData);
      } else {
        await base44.entities.PlayerCharacter.create(finalData);
      }
      onSaved?.();
    } catch (e) {
      setError(e?.message || 'Could not save character.');
    }
    setBusy(false);
  };

  if (step === 'method') {
    return (
      <div className="space-y-4">
        <h2 className="font-serif text-lg">How would you like to add the character?</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {METHODS.map(m => (
            <button key={m.key} onClick={() => pickMethod(m.key)} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-left hover:border-brand/40">
              <m.icon size={20} className="mt-0.5 text-brand"/>
              <div>
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
        {onClose && <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>}
      </div>
    );
  }

  if (step === 'extracting') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <Loader2 size={20} className="animate-spin text-brand"/>
        Analyzing character sheet…
      </div>
    );
  }

  if (step === 'upload') {
    return <SheetUploader onContinue={handleUpload} onBack={() => isUpdate ? onClose?.() : setStep('method')} busy={busy}/>;
  }

  if (step === 'manual') {
    return (
      <div className="space-y-3">
        {error && <p className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">{error}</p>}
        <ManualEntryForm initial={extracted} quickMode={method === 'quick'} onSave={handleSave} onBack={() => setStep(isUpdate ? 'upload' : 'method')} busy={busy}/>
      </div>
    );
  }

  if (step === 'review') {
    return <ImportReview data={extracted} existingCharacter={existingCharacter} onSave={handleSave} onBack={() => setStep('upload')} busy={busy}/>;
  }

  return null;
}