"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAsync } from "@/hooks";
import { addNote, deleteNote, getNotes, getRecordById, patchRecordStatus } from "@/lib";
import {
  RECORD_STAGES,
  RECORD_STATUSES,
  STAGE_LABELS,
  STATUS_LABELS,
  type RecordDetail,
  type RecordNote,
  type RecordStage,
  type RecordStatus
} from "@/types";

type CandidateDetailPageProps = {
  recordId: string;
  showUpdatedMessage?: boolean;
};

function formatOptionLabel(value: string): string {
  return STATUS_LABELS[value] ?? STAGE_LABELS[value] ?? value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function CandidateDetailPage({ recordId, showUpdatedMessage = false }: CandidateDetailPageProps) {
  const recordQuery = useAsync(getRecordById);
  const notesQuery = useAsync(getNotes);
  const patchQuery = useAsync(patchRecordStatus);
  const addNoteQuery = useAsync(addNote);
  const deleteNoteQuery = useAsync(deleteNote);

  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [notes, setNotes] = useState<RecordNote[]>([]);
  const [noteContent, setNoteContent] = useState("");
  const [notesErrorMessage, setNotesErrorMessage] = useState<string | null>(null);
  const [recordMutationError, setRecordMutationError] = useState<string | null>(null);

  useEffect(() => {
    void recordQuery.execute(recordId);
    void notesQuery.execute(recordId);
  }, [recordQuery.execute, recordId, notesQuery.execute]);

  useEffect(() => {
    if (recordQuery.data) {
      setRecord(recordQuery.data);
    }
  }, [recordQuery.data]);

  useEffect(() => {
    if (notesQuery.data) {
      setNotes(notesQuery.data.data);
    }
  }, [notesQuery.data]);

  async function updateRecordPartial(input: { status?: RecordStatus; stage?: RecordStage }) {
    setRecordMutationError(null);
    const result = await patchQuery.execute(recordId, input);

    if (result.error) {
      setRecordMutationError(result.error.message);
      return;
    }

    setRecord(result.data);
  }

  async function handleAddNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = noteContent.trim();
    if (!trimmedContent) {
      setNotesErrorMessage("Enter a note before saving.");
      return;
    }

    setNotesErrorMessage(null);
    const result = await addNoteQuery.execute(recordId, { content: trimmedContent });

    if (result.error) {
      setNotesErrorMessage(result.error.message);
      return;
    }

    setNotes((currentNotes) => [result.data, ...currentNotes]);
    setRecord((currentRecord) =>
      currentRecord
        ? {
            ...currentRecord,
            notes_count: currentRecord.notes_count + 1
          }
        : currentRecord
    );
    setNoteContent("");
  }

  async function handleDeleteNote(noteId: string) {
    setNotesErrorMessage(null);
    const result = await deleteNoteQuery.execute(recordId, noteId);

    if (result.error) {
      setNotesErrorMessage(result.error.message);
      return;
    }

    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
    setRecord((currentRecord) =>
      currentRecord
        ? {
            ...currentRecord,
            notes_count: Math.max(0, currentRecord.notes_count - 1)
          }
        : currentRecord
    );
  }

  const isInitialLoading = recordQuery.isLoading && !record;
  const isNotesLoading = notesQuery.isLoading && notes.length === 0;

  return (
    <main>
      <p>
        <Link href="/candidates">Back to records</Link>
      </p>

      {showUpdatedMessage ? (
        <section aria-live="polite">
          <p>Candidate updated successfully.</p>
        </section>
      ) : null}

      {isInitialLoading ? <p role="status">Loading record...</p> : null}

      {recordQuery.error && !record ? (
        <section aria-live="polite">
          <h1>Unable to load record</h1>
          <p>{recordQuery.error.message}</p>
        </section>
      ) : null}

      {record ? (
        <>
          <section aria-live="polite">
            <h1>{record.full_name}</h1>
            <p>
              <Link href={`/candidates/${record.id}/edit`}>Edit candidate</Link>
            </p>
            <p>Name: {record.full_name}</p>
            <p>Email: {record.email}</p>
            <p>Phone: {record.phone}</p>
            <p>Position: {record.position}</p>
            <p>
              LinkedIn:{" "}
              {record.linkedin_url ? (
                <Link href={record.linkedin_url} target="_blank" rel="noreferrer">
                  View LinkedIn profile
                </Link>
              ) : (
                "Not provided"
              )}
            </p>
            <p>
              CV:{" "}
              {record.cv_url ? (
                <Link href={record.cv_url} target="_blank" rel="noreferrer">
                  Open CV
                </Link>
              ) : (
                "Not provided"
              )}
            </p>
            <p>Years of experience: {record.experience_years}</p>
            <p>Application date: {formatDate(record.applied_at)}</p>
          </section>

          <section aria-label="Record status controls">
            <label htmlFor="candidate-status">Status</label>
            <select
              id="candidate-status"
              value={record.status}
              onChange={(event) => void updateRecordPartial({ status: event.target.value as RecordStatus })}
              disabled={patchQuery.isLoading}
            >
              {RECORD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatOptionLabel(status)}
                </option>
              ))}
            </select>

            <label htmlFor="candidate-stage">Stage</label>
            <select
              id="candidate-stage"
              value={record.stage}
              onChange={(event) => void updateRecordPartial({ stage: event.target.value as RecordStage })}
              disabled={patchQuery.isLoading}
            >
              {RECORD_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {formatOptionLabel(stage)}
                </option>
              ))}
            </select>

            <p>Current status: {formatOptionLabel(record.status)}</p>
            <p>Current stage: {formatOptionLabel(record.stage)}</p>
            {patchQuery.isLoading ? <p role="status">Saving updates...</p> : null}
            {recordMutationError ? <p>{recordMutationError}</p> : null}
          </section>

          <section aria-label="Notes">
            <h2>Notes</h2>
            <p>Total notes: {record.notes_count}</p>

            <form onSubmit={handleAddNote}>
              <label htmlFor="new-note">Add a note</label>
              <textarea
                id="new-note"
                name="new-note"
                value={noteContent}
                onChange={(event) => setNoteContent(event.target.value)}
                rows={4}
              />
              <button type="submit" disabled={addNoteQuery.isLoading}>
                {addNoteQuery.isLoading ? "Saving note..." : "Save note"}
              </button>
            </form>

            {isNotesLoading ? <p role="status">Loading notes...</p> : null}
            {notesQuery.error && notes.length === 0 ? <p>{notesQuery.error.message}</p> : null}
            {notesErrorMessage ? <p>{notesErrorMessage}</p> : null}

            {notes.length === 0 && !isNotesLoading ? (
              <p>No notes for this record yet.</p>
            ) : (
              <ul>
                {notes.map((note) => (
                  <li key={note.id}>
                    <article>
                      <p>{note.content}</p>
                      <p>{formatDate(note.created_at)}</p>
                      <button
                        type="button"
                        onClick={() => void handleDeleteNote(note.id)}
                        disabled={deleteNoteQuery.isLoading}
                      >
                        {deleteNoteQuery.isLoading ? "Removing note..." : "Delete note"}
                      </button>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}