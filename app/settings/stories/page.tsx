"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { TopicChips } from "@/components/onboarding/TopicChips";
import { useProfile } from "@/context/ProfileContext";
import { MAX_STORIES, type Story, type Topic } from "@/lib/types";

const LS_KEY = "pca:stories:v1";
const STORY_WORD_TARGET = 200;

interface StoryFormState {
  title: string;
  body: string;
  tags: Topic[];
}

const EMPTY_FORM: StoryFormState = {
  title: "",
  body: "",
  tags: [],
};

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function localId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}`;
}

function loadLocalStories(): Story[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Story[]) : [];
  } catch {
    return [];
  }
}

function saveLocalStories(stories: Story[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(stories));
}

function StoryEditor({
  framed = true,
  initial,
  onCancel,
  onSave,
}: {
  framed?: boolean;
  initial?: StoryFormState;
  onCancel: () => void;
  onSave: (story: StoryFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<StoryFormState>(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const words = wordCount(form.body);
  const canSave = form.title.trim().length > 0 && form.body.trim().length > 0;

  const toggleTopic = (topic: Topic) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(topic)
        ? prev.tags.filter((t) => t !== topic)
        : [...prev.tags, topic],
    }));
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    await onSave({
      title: form.title.trim(),
      body: form.body.trim(),
      tags: form.tags,
    });
    setSaving(false);
  };

  return (
    <div
      className={
        framed
          ? "space-y-5 rounded-xl border border-rule bg-paper p-5"
          : "space-y-5"
      }
    >
      <label className="block">
        <span className="text-sm font-medium text-ink">Title</span>
        <input
          value={form.title}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="My experience with surprise medical bills"
          className="mt-2 w-full rounded-md border border-rule bg-cream-50 px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink">Story</span>
        <textarea
          value={form.body}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, body: e.target.value }))
          }
          rows={8}
          placeholder="A few specific details are enough. What happened? Who was affected? What changed for you?"
          className="mt-2 w-full rounded-md border border-rule bg-cream-50 px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <p
          className={`mt-2 text-right font-mono text-xs ${
            words > STORY_WORD_TARGET ? "text-accent" : "text-muted"
          }`}
        >
          {words}/{STORY_WORD_TARGET} words
        </p>
      </label>

      <div>
        <p className="mb-3 text-sm font-medium text-ink">Topic tags</p>
        <TopicChips selected={form.tags} onToggle={toggleTopic} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-cream-50 shadow-card hover:bg-accent-700 disabled:bg-accent/40 disabled:shadow-none"
        >
          <Check className="h-4 w-4" />
          {saving ? "Saving..." : "Save story"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-full border border-rule px-5 py-2.5 text-sm font-medium text-ink-600 hover:border-ink/40 hover:text-ink"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        {words > STORY_WORD_TARGET && (
          <p className="text-xs text-accent">
            Shorter stories are easier for the draft to use.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SettingsStoriesPage() {
  const router = useRouter();
  const { profile, hydrated } = useProfile();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/stories");
        if (r.ok) {
          const json = (await r.json()) as { stories: Story[] };
          if (!cancelled) {
            setStories(json.stories);
            saveLocalStories(json.stories);
            setApiAvailable(true);
            setLoading(false);
            return;
          }
        }
      } catch {
        // fall through to localStorage
      }
      if (cancelled) return;
      setStories(loadLocalStories());
      setApiAvailable(false);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistLocal = (next: Story[]) => {
    setStories(next);
    saveLocalStories(next);
  };

  const addStory = async (input: StoryFormState) => {
    setError(null);
    if (!apiAvailable) {
      const now = new Date().toISOString();
      persistLocal([
        {
          id: localId(),
          userId: "local",
          title: input.title,
          body: input.body,
          tags: input.tags,
          createdAt: now,
          updatedAt: now,
        },
        ...stories,
      ]);
      setAdding(false);
      return;
    }

    const r = await fetch("/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!r.ok) {
      setError("Could not save this story.");
      return;
    }
    const json = (await r.json()) as { story: Story };
    const next = [json.story, ...stories];
    setStories(next);
    saveLocalStories(next);
    setAdding(false);
    setExpandedId(json.story.id);
  };

  const updateStory = async (id: string, input: StoryFormState) => {
    setError(null);
    if (!apiAvailable) {
      const now = new Date().toISOString();
      persistLocal(
        stories.map((story) =>
          story.id === id
            ? { ...story, ...input, updatedAt: now }
            : story,
        ),
      );
      setEditingId(null);
      setExpandedId(id);
      return;
    }

    const r = await fetch(`/api/stories/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!r.ok) {
      setError("Could not update this story.");
      return;
    }
    const json = (await r.json()) as { story: Story };
    const next = stories.map((story) =>
      story.id === id ? json.story : story,
    );
    setStories(next);
    saveLocalStories(next);
    setEditingId(null);
    setExpandedId(id);
  };

  const removeStory = async (id: string) => {
    if (!window.confirm("Delete this story?")) return;
    setError(null);
    if (!apiAvailable) {
      persistLocal(stories.filter((story) => story.id !== id));
      return;
    }

    const r = await fetch(`/api/stories/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      setError("Could not delete this story.");
      return;
    }
    const next = stories.filter((story) => story.id !== id);
    setStories(next);
    saveLocalStories(next);
  };

  if (!hydrated || !profile) {
    return (
      <main className="min-h-screen">
        <FeedHeader />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <FeedHeader />

      <section className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to settings
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="headline text-4xl">Stories</h1>
            <p className="mt-3 max-w-2xl text-base text-ink-600">
              Save up to five short experiences that can ground future comment
              drafts when the topic matches.
            </p>
          </div>
          {!loading && !adding && stories.length < MAX_STORIES && (
            <button
              type="button"
              onClick={() => {
                setAdding(true);
                setEditingId(null);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream-50 shadow-card hover:bg-ink-600"
            >
              <Plus className="h-4 w-4" />
              Add story
            </button>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-rule bg-cream-50 p-5 text-sm text-ink-600">
          <p className="font-medium text-ink">Examples</p>
          <p className="mt-2">
            My experience with surprise medical bills. Why my small business
            struggled with a rule change. What it takes to care for a disabled
            parent at home.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-accent/30 bg-accent-50 p-3 text-sm text-accent">
            {error}
          </p>
        )}

        <div className="mt-8 space-y-4">
          {adding && (
            <StoryEditor
              onCancel={() => setAdding(false)}
              onSave={addStory}
            />
          )}

          {loading ? (
            <div className="rounded-xl border border-rule bg-paper p-6">
              <div className="skeleton h-6 w-1/2" />
              <div className="skeleton mt-3 h-4 w-full" />
              <div className="skeleton mt-2 h-4 w-2/3" />
            </div>
          ) : stories.length === 0 && !adding ? (
            <div className="rounded-xl border border-rule bg-paper p-8 text-center">
              <p className="font-display text-2xl">No stories yet.</p>
              <p className="mt-2 text-sm text-ink-600">
                Add one when there is a life experience you want the draft to
                understand.
              </p>
            </div>
          ) : (
            stories.map((story) => {
              const expanded = expandedId === story.id;
              const editing = editingId === story.id;
              return (
                <article
                  key={story.id}
                  className="rounded-xl border border-rule bg-paper p-5"
                >
                  {editing ? (
                    <StoryEditor
                      framed={false}
                      initial={{
                        title: story.title,
                        body: story.body,
                        tags: story.tags,
                      }}
                      onCancel={() => setEditingId(null)}
                      onSave={(input) => updateStory(story.id, input)}
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : story.id)
                        }
                        className="flex w-full items-start gap-3 text-left"
                      >
                        <ChevronDown
                          className={`mt-1 h-4 w-4 flex-shrink-0 text-muted transition ${
                            expanded ? "rotate-180" : ""
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <h2 className="font-display text-xl text-ink">
                            {story.title}
                          </h2>
                          <p className="mt-1 text-xs text-muted">
                            Updated{" "}
                            {new Date(story.updatedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      </button>

                      {expanded && (
                        <div className="mt-4 space-y-4 border-t border-rule pt-4">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
                            {story.body}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {story.tags.length > 0 ? (
                              story.tags.map((tag) => (
                                <span key={tag} className="chip">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted">
                                No topic tags
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(story.id);
                                setAdding(false);
                              }}
                              className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-xs font-medium text-ink-600 hover:border-ink/40 hover:text-ink"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStory(story.id)}
                              className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-xs font-medium text-accent hover:border-accent/50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </article>
              );
            })
          )}
        </div>

        {stories.length >= MAX_STORIES && !adding && (
          <p className="mt-5 text-center text-xs text-muted">
            You have reached the five-story limit. Delete a story to add
            another.
          </p>
        )}
      </section>
    </main>
  );
}
