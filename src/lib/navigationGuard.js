// Lightweight navigation guard: lets the Home button ask the NPC wizard
// (or any component) whether there are unsaved changes before leaving.
let guardFn = null;

export const setNavigationGuard = (fn) => {
  guardFn = fn;
  return () => { if (guardFn === fn) guardFn = null; };
};

export const hasUnsavedChanges = () => (guardFn ? guardFn() : false);