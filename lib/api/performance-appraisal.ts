import * as actions from "./performance-appraisal.actions";
import { callAction } from "./action-result";
export type * from "@/lib/types/performance-appraisal";

export const getAppraisalHistory = () => callAction(actions.getAppraisalHistory);
export const getAppraisalById = (id: string) => callAction(() => actions.getAppraisalById(id));
export const getAppraisalStats = () => callAction(actions.getAppraisalStats);
export const saveSelfAppraisalDraft = (...args: Parameters<typeof actions.saveSelfAppraisalDraft>) => callAction(() => actions.saveSelfAppraisalDraft(...args));
export const submitSelfAppraisal = (...args: Parameters<typeof actions.submitSelfAppraisal>) => callAction(() => actions.submitSelfAppraisal(...args));
