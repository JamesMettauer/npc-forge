import NavControls from '@/components/NavControls';
import PageHeader from '@/components/PageHeader';
import InterviewChat from '@/components/agent/InterviewChat';

export default function PersonalityInterview() {
  return (
    <div className="p-5 sm:p-8">
      <NavControls/>
      <PageHeader
        eyebrow="AI interviewer"
        title="NPC Personality Interview"
        description="A guided conversation that draws out a detailed, coherent personality for a new NPC — one question at a time — then saves it to your library."
      />
      <div className="mt-2">
        <InterviewChat/>
      </div>
    </div>
  );
}