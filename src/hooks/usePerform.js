import { useCallback } from 'react';
import { useFeedback } from '../components/Feedback';
import { WorkflowError } from '../data/store';

/**
 * Runs a store action the way the Livewire pages do: success → toast,
 * WorkflowException → danger toast. Returns true when the action succeeded.
 */
export function usePerform() {
    const { toast } = useFeedback();
    return useCallback(
        (fn, success) => {
            try {
                fn();
                if (success) toast(success, 'success');
                return true;
            } catch (e) {
                if (!(e instanceof WorkflowError)) throw e;
                toast(e.message, 'danger');
                return false;
            }
        },
        [toast],
    );
}
