import type { PaginatedResponse } from "@/types/api";

export const RECORD_STATUSES = ["received", "in_progress", "selected", "discarded"] as const;

export const RECORD_STAGES = [
  "pending",
  "review",
  "personal_interview",
  "technical_interview",
  "offer_presented"
] as const;

/** Human-readable labels for status values — always use these instead of raw API values. */
export const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  in_progress: "In progress",
  selected: "Selected",
  discarded: "Discarded"
};

/** Human-readable labels for stage values — always use these instead of raw API values. */
export const STAGE_LABELS: Record<string, string> = {
  pending: "Pending review",
  review: "Under review",
  personal_interview: "Personal interview",
  technical_interview: "Technical interview",
  offer_presented: "Offer presented"
};

export type RecordStatus = (typeof RECORD_STATUSES)[number];
export type RecordStage = (typeof RECORD_STAGES)[number];

export interface RecordNote {
  id: string;
  record_id: string;
  content: string;
  created_at: string;
}

export interface RecordBase {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url?: string | null;
  cv_url?: string | null;
  status: RecordStatus;
  stage: RecordStage;
  experience_years: number;
  applied_at: string;
  updated_at: string;
  notes_count: number;
}

export interface RecordListItem extends RecordBase {
  notes: RecordNote[];
}

export type RecordDetail = RecordBase;

export type GetRecordsResponse = PaginatedResponse<RecordListItem>;

export interface GetRecordNotesResponse {
  data: RecordNote[];
  meta: {
    total: number;
  };
}

export interface RecordUpsertInput {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url?: string | null;
  cv_url?: string | null;
  status: RecordStatus;
  stage: RecordStage;
  experience_years: number;
}

export type CreateRecordInput = RecordUpsertInput;
export type UpdateRecordInput = RecordUpsertInput;

export interface PatchRecordStatusInput {
  status?: RecordStatus;
  stage?: RecordStage;
}

export interface AddNoteInput {
  content: string;
}

export type CreateRecordResponse = RecordDetail;
export type UpdateRecordResponse = RecordDetail;
export type PatchRecordStatusResponse = RecordDetail;
export type AddNoteResponse = RecordNote;
export type DeleteNoteResponse = null;