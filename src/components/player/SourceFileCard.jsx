import { FileText, Eye, Upload } from 'lucide-react';

export default function SourceFileCard({ character, onUpdate }){
  if (!character.source_file_url && !character.source_file_name) return null;
  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Source Character Sheet</p>
      <div className="flex items-center gap-2 text-xs">
        <FileText size={14} className="text-muted-foreground"/>
        <span className="flex-1 truncate text-foreground">{character.source_file_name || 'Uploaded file'}</span>
        {character.sheet_version > 1 && <span className="text-muted-foreground">v{character.sheet_version}</span>}
      </div>
      {character.upload_date && (
        <p className="mt-1 text-[10px] text-muted-foreground">Uploaded {new Date(character.upload_date).toLocaleDateString()}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {character.source_file_url && (
          <a href={character.source_file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] text-foreground hover:bg-muted"><Eye size={12}/>View Original</a>
        )}
        {onUpdate && <button onClick={onUpdate} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] text-foreground hover:bg-muted"><Upload size={12}/>Upload New Version</button>}
      </div>
    </div>
  );
}