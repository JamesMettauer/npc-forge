import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ label='Back', className='', onClick, fallback }){
  const navigate = useNavigate();
  const handle = onClick || (() => {
    // React Router tracks the SPA history index in history.state.idx.
    // Only go back when there is a real previous app entry; otherwise use
    // the explicit fallback so refresh / direct-link entry never lands on
    // a blank or external page.
    const idx = window.history.state?.idx;
    if (typeof idx === 'number' && idx > 0) navigate(-1);
    else if (fallback) navigate(fallback);
    else navigate('/');
  });
  return <button onClick={handle} className={`flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted ${className}`}><ArrowLeft size={16}/>{label}</button>;
}