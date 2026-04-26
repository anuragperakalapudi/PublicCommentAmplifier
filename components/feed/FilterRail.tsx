"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { Topic } from "@/lib/types";

export type DeadlineFilter = "week" | "month" | "any";

export interface FilterState {
  agencies: string[];
  topics: Topic[];
  deadline: DeadlineFilter;
  minMatch: number;
  stateRelevant: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  agencies: [],
  topics: [],
  deadline: "any",
  minMatch: 0,
  stateRelevant: false,
};

export function isAnyFilterActive(f: FilterState): boolean {
  return (
    f.agencies.length > 0 ||
    f.topics.length > 0 ||
    f.deadline !== "any" ||
    f.minMatch > 0 ||
    f.stateRelevant
  );
}

export function activeFilterCount(f: FilterState): number {
  let n = 0;
  if (f.agencies.length > 0) n++;
  if (f.topics.length > 0) n++;
  if (f.deadline !== "any") n++;
  if (f.minMatch > 0) n++;
  if (f.stateRelevant) n++;
  return n;
}

interface AgencyOption {
  id: string;
  name: string;
  count: number;
}

interface TopicOption {
  topic: Topic;
  count: number;
}

interface FilterRailProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  agencyOptions: AgencyOption[];
  topicOptions: TopicOption[];
  stateLabel: string;
}

export function FilterRail({
  filters,
  onChange,
  agencyOptions,
  topicOptions,
  stateLabel,
}: FilterRailProps) {
  const [agencyOpen, setAgencyOpen] = useState(true);
  const [topicOpen, setTopicOpen] = useState(true);

  const toggleAgency = (id: string) => {
    onChange({
      ...filters,
      agencies: filters.agencies.includes(id)
        ? filters.agencies.filter((a) => a !== id)
        : [...filters.agencies, id],
    });
  };

  const toggleTopic = (t: Topic) => {
    onChange({
      ...filters,
      topics: filters.topics.includes(t)
        ? filters.topics.filter((x) => x !== t)
        : [...filters.topics, t],
    });
  };

  const reset = () => onChange(EMPTY_FILTERS);
  const active = activeFilterCount(filters);

  return (
    <section className="rounded-xl border border-rule bg-paper p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          {active > 0 && (
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-mono text-cream-50">
              {active}
            </span>
          )}
        </div>
        {active > 0 && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Deadline */}
      <div className="mt-4">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted">
          Deadline
        </p>
        <div className="flex gap-1.5">
          {(["week", "month", "any"] as DeadlineFilter[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ ...filters, deadline: d })}
              className={`flex-1 rounded-full border px-2 py-1 text-xs transition ${
                filters.deadline === d
                  ? "border-ink bg-ink text-cream-50"
                  : "border-rule bg-paper text-ink hover:border-ink/40"
              }`}
            >
              {d === "week" ? "This week" : d === "month" ? "This month" : "Any"}
            </button>
          ))}
        </div>
      </div>

      {/* Match score */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted">
            Min match
          </p>
          <span className="font-mono text-xs text-ink">
            {filters.minMatch === 0 ? "any" : `${filters.minMatch}%+`}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={95}
          step={5}
          value={filters.minMatch}
          onChange={(e) =>
            onChange({ ...filters, minMatch: Number(e.target.value) })
          }
          list="match-ticks"
          className="w-full accent-accent"
          aria-label="Minimum match score"
        />
        <datalist id="match-ticks">
          <option value="0" />
          <option value="25" />
          <option value="50" />
          <option value="75" />
          <option value="95" />
        </datalist>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>95%</span>
        </div>
      </div>

      {/* State relevance */}
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink">State-relevant only</p>
          <p className="text-xs text-muted">
            Rules that mention {stateLabel}.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({ ...filters, stateRelevant: !filters.stateRelevant })
          }
          aria-pressed={filters.stateRelevant}
          aria-label="Toggle state relevance filter"
          className={`mt-1 h-5 w-9 flex-shrink-0 rounded-full border transition ${
            filters.stateRelevant
              ? "border-ink bg-ink"
              : "border-rule bg-cream-100"
          }`}
        >
          <span
            className={`block h-3.5 w-3.5 rounded-full bg-cream-50 shadow transition-transform ${
              filters.stateRelevant ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Topic */}
      <div className="mt-5 border-t border-rule pt-4">
        <button
          type="button"
          onClick={() => setTopicOpen((v) => !v)}
          className="flex w-full items-center justify-between text-[11px] font-medium uppercase tracking-widest text-muted hover:text-ink"
        >
          <span>
            Topic {filters.topics.length > 0 && `(${filters.topics.length})`}
          </span>
          {topicOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        {topicOpen && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {topicOptions.length === 0 && (
              <p className="text-xs text-muted">No topics in current feed.</p>
            )}
            {topicOptions.map(({ topic, count }) => {
              const active = filters.topics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                    active
                      ? "border-ink bg-ink text-cream-50"
                      : "border-rule bg-paper text-ink hover:border-ink/40"
                  }`}
                >
                  <span>{topic}</span>
                  <span
                    className={`font-mono text-[10px] ${active ? "text-cream-50/80" : "text-muted"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Agency */}
      <div className="mt-4 border-t border-rule pt-4">
        <button
          type="button"
          onClick={() => setAgencyOpen((v) => !v)}
          className="flex w-full items-center justify-between text-[11px] font-medium uppercase tracking-widest text-muted hover:text-ink"
        >
          <span>
            Agency {filters.agencies.length > 0 && `(${filters.agencies.length})`}
          </span>
          {agencyOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        {agencyOpen && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {agencyOptions.length === 0 && (
              <p className="text-xs text-muted">No agencies in current feed.</p>
            )}
            {agencyOptions.slice(0, 14).map(({ id, count }) => {
              const active = filters.agencies.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleAgency(id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest transition ${
                    active
                      ? "border-ink bg-ink text-cream-50"
                      : "border-rule bg-paper text-ink hover:border-ink/40"
                  }`}
                >
                  <span>{id}</span>
                  <span
                    className={`font-mono text-[10px] ${active ? "text-cream-50/80" : "text-muted"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
