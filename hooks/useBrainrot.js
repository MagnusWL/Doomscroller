'use client';

import { useCallback, useState } from 'react';
import { initialBrainState, decay, currentSpeed, isDepleted } from '@/lib/brainrot';

// React-state wrapper around the pure brainrot decay math in lib/brainrot.js.
export function useBrainrot() {
  const [state, setState] = useState(initialBrainState);

  const advance = useCallback(() => {
    setState(prev => decay(prev));
  }, []);

  const refill = useCallback(() => {
    setState(initialBrainState());
  }, []);

  return {
    braincells: state.braincells,
    brainrotSpeed: currentSpeed(state),
    depleted: isDepleted(state),
    advance,
    refill,
  };
}
