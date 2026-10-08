// The server returns serializable results; errors are reconstructed in the caller.
import * as actions from "./performance-appraisal.actions";
import { callAction, type ActionData } from "./action-result";
export type * from "./performance-appraisal.actions";

export async function getAppraisalHistory(...args: Parameters<typeof actions.getAppraisalHistory>): Promise<ActionData<Awaited<ReturnType<typeof actions.getAppraisalHistory>>>> {
  return callAction(() => actions.getAppraisalHistory(...args));
}

export async function getAppraisalById(...args: Parameters<typeof actions.getAppraisalById>): Promise<ActionData<Awaited<ReturnType<typeof actions.getAppraisalById>>>> {
  return callAction(() => actions.getAppraisalById(...args));
}

export async function getAppraisalStats(...args: Parameters<typeof actions.getAppraisalStats>): Promise<ActionData<Awaited<ReturnType<typeof actions.getAppraisalStats>>>> {
  return callAction(() => actions.getAppraisalStats(...args));
}

export async function submitSelfAppraisal(...args: Parameters<typeof actions.submitSelfAppraisal>): Promise<ActionData<Awaited<ReturnType<typeof actions.submitSelfAppraisal>>>> {
  return callAction(() => actions.submitSelfAppraisal(...args));
}

export async function submitSupervisorAppraisal(...args: Parameters<typeof actions.submitSupervisorAppraisal>): Promise<ActionData<Awaited<ReturnType<typeof actions.submitSupervisorAppraisal>>>> {
  return callAction(() => actions.submitSupervisorAppraisal(...args));
}

export async function submitMPAppraisal(...args: Parameters<typeof actions.submitMPAppraisal>): Promise<ActionData<Awaited<ReturnType<typeof actions.submitMPAppraisal>>>> {
  return callAction(() => actions.submitMPAppraisal(...args));
}
