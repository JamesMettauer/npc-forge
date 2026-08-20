import { Link } from 'react-router-dom';
import { AlertCircle, BookOpen, Users, MessageSquare, Wand2, Newspaper, Search } from 'lucide-react';

// Compact mobile view — themed cards in priority order, no desk layout.
export default function CompactDashboard({ objects, order, hidden, theme, styles, onSearch }) {
  const ids = order.filter((id) => !hidden.includes(id) && objects[id]);
  return (
    <div className="min-h-[calc(100vh-64px)] p-4" style={styles.backdrop}>
      <div className="mx-auto max-w-2xl space-y-4">
        {ids.map((id) => <div key={id}>{objects[id].node}</div>)}
      </div>
    </div>
  );
}