import BackButton from './BackButton';
import HomeButton from './HomeButton';

export default function NavControls({ fallback, onClick, className='mb-4' }){
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <BackButton fallback={fallback} onClick={onClick} className=""/>
      <HomeButton/>
    </div>
  );
}