import type { Regulation, Story } from "./types";

export function storyRelevance(story: Story, reg: Regulation): number {
  return story.tags.filter((t) => reg.topics.includes(t)).length;
}

export function selectRelevantStories(
  stories: Story[],
  reg: Regulation,
  limit = 2,
): Story[] {
  return stories
    .map((story, index) => ({
      story,
      index,
      relevance: storyRelevance(story, reg),
    }))
    .filter((item) => item.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || a.index - b.index)
    .slice(0, limit)
    .map((item) => item.story);
}
