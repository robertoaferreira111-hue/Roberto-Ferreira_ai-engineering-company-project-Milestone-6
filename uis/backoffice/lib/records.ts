import { apiRequest } from "@/lib/api-client";
import type {
  AddNoteInput,
  AddNoteResponse,
  ApiResult,
  CreateRecordInput,
  CreateRecordResponse,
  DeleteNoteResponse,
  GetRecordNotesResponse,
  GetRecordsResponse,
  PatchRecordStatusInput,
  PatchRecordStatusResponse,
  RecordDetail,
  UpdateRecordInput,
  UpdateRecordResponse
} from "@/types";

export async function getRecords(): Promise<ApiResult<GetRecordsResponse>> {
  return apiRequest<GetRecordsResponse>("records");
}

export async function getRecordById(recordId: string): Promise<ApiResult<RecordDetail>> {
  return apiRequest<RecordDetail>(`records/${recordId}`);
}

export async function createRecord(input: CreateRecordInput): Promise<ApiResult<CreateRecordResponse>> {
  return apiRequest<CreateRecordResponse>("records", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateRecord(
  recordId: string,
  input: UpdateRecordInput
): Promise<ApiResult<UpdateRecordResponse>> {
  return apiRequest<UpdateRecordResponse>(`records/${recordId}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export async function patchRecordStatus(
  recordId: string,
  input: PatchRecordStatusInput
): Promise<ApiResult<PatchRecordStatusResponse>> {
  return apiRequest<PatchRecordStatusResponse>(`records/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function getNotes(recordId: string): Promise<ApiResult<GetRecordNotesResponse>> {
  return apiRequest<GetRecordNotesResponse>(`records/${recordId}/notes`);
}

export async function addNote(recordId: string, input: AddNoteInput): Promise<ApiResult<AddNoteResponse>> {
  return apiRequest<AddNoteResponse>(`records/${recordId}/notes`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function deleteNote(recordId: string, noteId: string): Promise<ApiResult<DeleteNoteResponse>> {
  return apiRequest<DeleteNoteResponse>(`records/${recordId}/notes/${noteId}`, {
    method: "DELETE"
  });
}