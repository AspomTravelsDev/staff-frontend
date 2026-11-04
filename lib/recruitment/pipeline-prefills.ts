import type { RoleDetailResponse } from "../types/recruitment";
import { pipelineLabels, type PipelineContext } from "../types/recruitment-pipeline";

/** Expand shared definitions once on the server; preserve historical definition overrides. */
export function recruitmentPipelinePrefills(data: RoleDetailResponse): Record<string, PipelineContext> {
  const definition = data.role.pipeline_config;
  if (!definition) return {};
  const contexts: Record<string, PipelineContext> = {};
  for (const candidate of data.candidates) {
    const prefill = data.pipeline_prefills?.[candidate.id];
    if (!prefill || !candidate.pipeline_stage) continue;
    const records = prefill.records.map(record => ({ ...record, definition: record.definition ?? definition }));
    contexts[candidate.id] = {
      candidate,
      role: data.role,
      records,
      definition: records.find(record => record.stage === candidate.pipeline_stage)?.definition ?? definition,
      stages: pipelineLabels,
      events: prefill.events,
      final_score: prefill.final_score,
    };
  }
  return contexts;
}
