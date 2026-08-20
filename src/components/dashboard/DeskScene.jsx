import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Eye, EyeOff, Lock, Unlock } from 'lucide-react';

// Object span map for the normal grid layout.
export const OBJECT_SPAN = { attention: 2, ledger: 2, npcs: 1, conversations: 1, quickactions: 1, news: 1, search: 1 };

export default function DeskScene({ theme, styles, reduceMotion, arrange, order, hidden, locked, objects, onReorder, onToggleHide, onToggleLock }) {
  const visibleIds = arrange ? order : order.filter((id) => !hidden.includes(id) && objects[id]);

  const onDragEnd = (r) => {
    if (!r.destination) return;
    const next = Array.from(order);
    const [moved] = next.splice(r.source.index, 1);
    next.splice(r.destination.index, 0, moved);
    onReorder(next);
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)]" style={styles.backdrop}>
      <div className={`desk-scene ${reduceMotion ? 'desk-reduce-motion' : ''}`}>
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-6">
          {/* Desk surface */}
          <div className="relative rounded-2xl p-4 sm:p-6" style={styles.desk}>
            {arrange ? (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="desk">
                  {(prov) => (
                    <div ref={prov.innerRef} {...prov.droppableProps} className="space-y-3">
                      {visibleIds.map((id, i) => {
                        const obj = objects[id];
                        if (!obj) return null;
                        return (
                          <Draggable key={id} draggableId={id} index={i}>
                            {(p) => (
                              <div ref={p.innerRef} {...p.draggableProps} className="rounded-xl" style={p.draggableProps.style}>
                                <div {...p.dragHandleProps} className="flex items-center gap-2 rounded-t-lg px-3 py-1.5" style={{ background: 'rgba(0,0,0,0.25)' }}>
                                  <GripVertical size={14} className="text-white" />
                                  <span className="flex-1 text-xs font-semibold text-white">{obj.label}</span>
                                  <button onClick={() => onToggleLock(id)} className="text-white/80" title={locked.includes(id) ? 'Unlock' : 'Lock'}>{locked.includes(id) ? <Lock size={12}/> : <Unlock size={12}/>}</button>
                                  <button onClick={() => onToggleHide(id)} className="text-white/80" title="Hide">{hidden.includes(id) ? <Eye size={12}/> : <EyeOff size={12}/>}</button>
                                </div>
                                <div className="rounded-b-xl">{obj.node}</div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {prov.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleIds.map((id) => {
                  const obj = objects[id];
                  if (!obj) return null;
                  const span = OBJECT_SPAN[id] === 2 ? 'lg:col-span-2' : '';
                  return <div key={id} className={span}>{obj.node}</div>;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}