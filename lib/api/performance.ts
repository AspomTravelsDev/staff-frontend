import * as actions from "./performance.actions";
import { callAction } from "./action-result";
export type * from "@/lib/types/performance-result";

export const getCompletedResults = (...args: Parameters<typeof actions.getCompletedResults>) => callAction(() => actions.getCompletedResults(...args));
export const getCompletedResult = (id: string) => callAction(() => actions.getCompletedResult(id));
