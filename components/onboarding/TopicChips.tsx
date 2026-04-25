import { ALL_TOPICS, type Topic } from "@/lib/types";
import {
  Heart, Home, Briefcase, Accessibility, Globe, Leaf,
  GraduationCap, Award, Building2,
  Scale, DollarSign, Shield, ShoppingBag,
} from "lucide-react";

const TOPIC_ICONS: Record<Topic, React.ComponentType<{ className?: string }>> = {
  Healthcare: Heart,
  Housing: Home,
  Labor: Briefcase,
  Disability: Accessibility,
  Immigration: Globe,
  Environment: Leaf,
  Education: GraduationCap,
  Veterans: Award,
  "Small Business": Building2,
  "Civil Rights": Scale,
  "Tax & Finance": DollarSign,
  "Public Safety": Shield,
  "Consumer Protection": ShoppingBag,
};

export function TopicChips({
  selected,
  onToggle,
}: {
  selected: Topic[];
  onToggle: (t: Topic) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_TOPICS.map((topic) => {
        const Icon = TOPIC_ICONS[topic];
        const active = selected.includes(topic);
        return (
          <button
            key={topic}
            type="button"
            onClick={() => onToggle(topic)}
            className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
              active
                ? "border-ink bg-ink text-cream-50 shadow-card"
                : "border-rule bg-paper text-ink hover:border-ink/40"
            }`}
          >
            <Icon
              className={`h-4 w-4 ${active ? "text-accent" : "text-ink-400"}`}
            />
            {topic}
          </button>
        );
      })}
    </div>
  );
}
