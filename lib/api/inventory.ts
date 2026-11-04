// The server returns serializable results; errors are reconstructed in the caller.
import * as actions from "./inventory.actions";
import { callAction, type ActionData } from "./action-result";
export type * from "./inventory.actions";

export async function getInventory(...args: Parameters<typeof actions.getInventory>): Promise<ActionData<Awaited<ReturnType<typeof actions.getInventory>>>> {
  return callAction(() => actions.getInventory(...args));
}

export async function getInventoryStats(...args: Parameters<typeof actions.getInventoryStats>): Promise<ActionData<Awaited<ReturnType<typeof actions.getInventoryStats>>>> {
  return callAction(() => actions.getInventoryStats(...args));
}

export async function createInventoryItem(...args: Parameters<typeof actions.createInventoryItem>): Promise<ActionData<Awaited<ReturnType<typeof actions.createInventoryItem>>>> {
  return callAction(() => actions.createInventoryItem(...args));
}

export async function updateInventoryItem(...args: Parameters<typeof actions.updateInventoryItem>): Promise<ActionData<Awaited<ReturnType<typeof actions.updateInventoryItem>>>> {
  return callAction(() => actions.updateInventoryItem(...args));
}

export async function deleteInventoryItem(...args: Parameters<typeof actions.deleteInventoryItem>): Promise<ActionData<Awaited<ReturnType<typeof actions.deleteInventoryItem>>>> {
  return callAction(() => actions.deleteInventoryItem(...args));
}

export async function getInventoryHistory(...args: Parameters<typeof actions.getInventoryHistory>): Promise<ActionData<Awaited<ReturnType<typeof actions.getInventoryHistory>>>> {
  return callAction(() => actions.getInventoryHistory(...args));
}

export async function logInventoryInspection(...args: Parameters<typeof actions.logInventoryInspection>): Promise<ActionData<Awaited<ReturnType<typeof actions.logInventoryInspection>>>> {
  return callAction(() => actions.logInventoryInspection(...args));
}

export async function getMyInventory(...args: Parameters<typeof actions.getMyInventory>): Promise<ActionData<Awaited<ReturnType<typeof actions.getMyInventory>>>> {
  return callAction(() => actions.getMyInventory(...args));
}

export async function updateMyInventory(...args: Parameters<typeof actions.updateMyInventory>): Promise<ActionData<Awaited<ReturnType<typeof actions.updateMyInventory>>>> {
  return callAction(() => actions.updateMyInventory(...args));
}

export async function getMyInventoryHistory(...args: Parameters<typeof actions.getMyInventoryHistory>): Promise<ActionData<Awaited<ReturnType<typeof actions.getMyInventoryHistory>>>> {
  return callAction(() => actions.getMyInventoryHistory(...args));
}

export async function getMyInventoryAssignments(...args: Parameters<typeof actions.getMyInventoryAssignments>): Promise<ActionData<Awaited<ReturnType<typeof actions.getMyInventoryAssignments>>>> {
  return callAction(() => actions.getMyInventoryAssignments(...args));
}

export async function submitInventoryAssignmentDecision(...args: Parameters<typeof actions.submitInventoryAssignmentDecision>): Promise<ActionData<Awaited<ReturnType<typeof actions.submitInventoryAssignmentDecision>>>> {
  return callAction(() => actions.submitInventoryAssignmentDecision(...args));
}

export async function initiateInventoryAssignment(...args: Parameters<typeof actions.initiateInventoryAssignment>): Promise<ActionData<Awaited<ReturnType<typeof actions.initiateInventoryAssignment>>>> {
  return callAction(() => actions.initiateInventoryAssignment(...args));
}

export async function getInventoryOfficerQueue(...args: Parameters<typeof actions.getInventoryOfficerQueue>): Promise<ActionData<Awaited<ReturnType<typeof actions.getInventoryOfficerQueue>>>> {
  return callAction(() => actions.getInventoryOfficerQueue(...args));
}

export async function getInventoryComplianceQueue(...args: Parameters<typeof actions.getInventoryComplianceQueue>): Promise<ActionData<Awaited<ReturnType<typeof actions.getInventoryComplianceQueue>>>> {
  return callAction(() => actions.getInventoryComplianceQueue(...args));
}

export async function submitInventoryOfficerDecision(...args: Parameters<typeof actions.submitInventoryOfficerDecision>): Promise<ActionData<Awaited<ReturnType<typeof actions.submitInventoryOfficerDecision>>>> {
  return callAction(() => actions.submitInventoryOfficerDecision(...args));
}

export async function submitInventoryComplianceDecision(...args: Parameters<typeof actions.submitInventoryComplianceDecision>): Promise<ActionData<Awaited<ReturnType<typeof actions.submitInventoryComplianceDecision>>>> {
  return callAction(() => actions.submitInventoryComplianceDecision(...args));
}

export async function getInventoryItemAssignments(...args: Parameters<typeof actions.getInventoryItemAssignments>): Promise<ActionData<Awaited<ReturnType<typeof actions.getInventoryItemAssignments>>>> {
  return callAction(() => actions.getInventoryItemAssignments(...args));
}

export async function initiateSingleReturn(...args: Parameters<typeof actions.initiateSingleReturn>): Promise<ActionData<Awaited<ReturnType<typeof actions.initiateSingleReturn>>>> {
  return callAction(() => actions.initiateSingleReturn(...args));
}

export async function initiateFullClearance(...args: Parameters<typeof actions.initiateFullClearance>): Promise<ActionData<Awaited<ReturnType<typeof actions.initiateFullClearance>>>> {
  return callAction(() => actions.initiateFullClearance(...args));
}

export async function getClearanceOfficerQueue(...args: Parameters<typeof actions.getClearanceOfficerQueue>): Promise<ActionData<Awaited<ReturnType<typeof actions.getClearanceOfficerQueue>>>> {
  return callAction(() => actions.getClearanceOfficerQueue(...args));
}

export async function inspectClearanceReturn(...args: Parameters<typeof actions.inspectClearanceReturn>): Promise<ActionData<Awaited<ReturnType<typeof actions.inspectClearanceReturn>>>> {
  return callAction(() => actions.inspectClearanceReturn(...args));
}

export async function getClearanceComplianceQueue(...args: Parameters<typeof actions.getClearanceComplianceQueue>): Promise<ActionData<Awaited<ReturnType<typeof actions.getClearanceComplianceQueue>>>> {
  return callAction(() => actions.getClearanceComplianceQueue(...args));
}

export async function approveClearanceCompliance(...args: Parameters<typeof actions.approveClearanceCompliance>): Promise<ActionData<Awaited<ReturnType<typeof actions.approveClearanceCompliance>>>> {
  return callAction(() => actions.approveClearanceCompliance(...args));
}

export async function submitClearanceHandover(...args: Parameters<typeof actions.submitClearanceHandover>): Promise<ActionData<Awaited<ReturnType<typeof actions.submitClearanceHandover>>>> {
  return callAction(() => actions.submitClearanceHandover(...args));
}

export async function issueEquipment(...args: Parameters<typeof actions.issueEquipment>): Promise<ActionData<Awaited<ReturnType<typeof actions.issueEquipment>>>> {
  return callAction(() => actions.issueEquipment(...args));
}

export async function acknowledgeEquipment(...args: Parameters<typeof actions.acknowledgeEquipment>): Promise<ActionData<Awaited<ReturnType<typeof actions.acknowledgeEquipment>>>> {
  return callAction(() => actions.acknowledgeEquipment(...args));
}

export async function returnSelectedEquipment(...args: Parameters<typeof actions.returnSelectedEquipment>): Promise<ActionData<Awaited<ReturnType<typeof actions.returnSelectedEquipment>>>> {
  return callAction(() => actions.returnSelectedEquipment(...args));
}

export async function getEmployeeEquipment(...args: Parameters<typeof actions.getEmployeeEquipment>): Promise<ActionData<Awaited<ReturnType<typeof actions.getEmployeeEquipment>>>> {
  return callAction(() => actions.getEmployeeEquipment(...args));
}
