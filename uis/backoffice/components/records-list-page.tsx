"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useAsync } from "@/hooks";
import { getRecords } from "@/lib";
import { RECORD_STAGES, RECORD_STATUSES, STAGE_LABELS, STATUS_LABELS, type RecordStage, type RecordStatus } from "@/types";

function formatOptionLabel(value: string): string {
  return STATUS_LABELS[value] ?? STAGE_LABELS[value] ?? value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function isRecordStatus(value: string | null): value is RecordStatus {
  return value !== null && RECORD_STATUSES.includes(value as RecordStatus);
}

function isRecordStage(value: string | null): value is RecordStage {
  return value !== null && RECORD_STAGES.includes(value as RecordStage);
}

export function RecordsListPage() {
  const { data, isLoading, error, execute } = useAsync(getRecords);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status");
  const stageParam = searchParams.get("stage");
  const selectedStatus: RecordStatus | "" = isRecordStatus(statusParam) ? statusParam : "";
  const selectedStage: RecordStage | "" = isRecordStage(stageParam) ? stageParam : "";
  const searchTerm = searchParams.get("search") ?? "";
  const createdParam = searchParams.get("created");

  useEffect(() => {
    void execute();
  }, [execute]);

  function updateQueryParam(key: string, value: string) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (value.trim().length === 0) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }

    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  const records = data?.data ?? [];
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredRecords = records.filter((record) => {
    const matchesStatus = !selectedStatus || record.status === selectedStatus;
    const matchesStage = !selectedStage || record.stage === selectedStage;
    const matchesSearch =
      normalizedSearchTerm.length === 0 ||
      record.full_name.toLowerCase().includes(normalizedSearchTerm) ||
      record.email.toLowerCase().includes(normalizedSearchTerm);

    return matchesStatus && matchesStage && matchesSearch;
  });

  return (
    <main>
      <section>
        <p><Link href="/">Backoffice</Link> · <Link href="/incidents">Incident manager</Link></p>
        <h1>Talent pipeline</h1>
        <p>Search and filter the current recruiting records without leaving the page.</p>
        <p>
          <Link href="/candidates/new">Register a new candidate</Link>
        </p>
      </section>

      {createdParam === "1" ? (
        <section aria-live="polite">
          <p>Candidate created successfully.</p>
        </section>
      ) : null}

      <section aria-label="Record filters">
        <label htmlFor="record-search">Search by name or email</label>
        <input
          id="record-search"
          name="search"
          type="search"
          value={searchTerm}
          onChange={(event) => updateQueryParam("search", event.target.value)}
          placeholder="Search name or email"
        />

        <label htmlFor="status-filter">Status</label>
        <select
          id="status-filter"
          name="status"
          value={selectedStatus}
          onChange={(event) => updateQueryParam("status", event.target.value)}
        >
          <option value="">All statuses</option>
          {RECORD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatOptionLabel(status)}
            </option>
          ))}
        </select>

        <label htmlFor="stage-filter">Stage</label>
        <select
          id="stage-filter"
          name="stage"
          value={selectedStage}
          onChange={(event) => updateQueryParam("stage", event.target.value)}
        >
          <option value="">All stages</option>
          {RECORD_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {formatOptionLabel(stage)}
            </option>
          ))}
        </select>
      </section>

      {isLoading && !data ? <p role="status">Loading records...</p> : null}

      {error ? (
        <section aria-live="polite">
          <h2>Unable to load records</h2>
          <p>{error.message}</p>
        </section>
      ) : null}

      {!isLoading && !error ? (
        <section aria-live="polite">
          <h2>Results</h2>
          <p>
            Showing {filteredRecords.length} of {records.length} records.
          </p>

          {filteredRecords.length === 0 ? (
            <p>No records match the current filters.</p>
          ) : (
            <ul>
              {filteredRecords.map((record) => (
                <li key={record.id}>
                  <article>
                    <h3>{record.full_name}</h3>
                    <p>Position: {record.position}</p>
                    <p>Status: {formatOptionLabel(record.status)}</p>
                    <p>Stage: {formatOptionLabel(record.stage)}</p>
                    <p>Email: {record.email}</p>
                    <Link href={`/candidates/${record.id}`}>Open record</Link>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </main>
  );
}