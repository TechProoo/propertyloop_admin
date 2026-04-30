import { useSyncExternalStore } from "react";

/**
 * Tiny global store that drives the <ActionOverlay /> bouncing-ball loader.
 * Use anywhere — no Provider needed.
 *
 *   actionLoader.show("Deleting…");
 *   try { await api(); } finally { actionLoader.hide(); }
 */

type State = { open: boolean; label: string };

let state: State = { open: false, label: "Working…" };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const actionLoader = {
  show(label: string = "Working…") {
    state = { open: true, label };
    emit();
  },
  hide() {
    if (!state.open) return;
    state = { open: false, label: state.label };
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  getSnapshot() {
    return state;
  },
};

export function useActionLoader(): State {
  return useSyncExternalStore(
    actionLoader.subscribe,
    actionLoader.getSnapshot,
    actionLoader.getSnapshot,
  );
}
