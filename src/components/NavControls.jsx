import BackButton from './BackButton';
import HomeButton from './HomeButton';

/**
 * @param {{ fallback?: string, onClick?: (() => void) | null, className?: string }} props
 */
export default function NavControls({ fallback = '', onClick = null, className = 'mb-4' }){
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <BackButton fallback={fallback} onClick={onClick} className=""/>
      <HomeButton/>
    </div>
  );
}
