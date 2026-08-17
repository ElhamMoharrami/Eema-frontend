"use client";

export type Example = { label: string; query: string };

export const EXAMPLES: Example[] = [
  {
    label: "Couture campaign · baroque salon · €8000",
    query:
      "One-day couture campaign shoot for a Maison. Need a baroque or rococo salon with chandeliers and frescoes — Paris or Vienna preferred. Crew of 18, hair & make-up on site, budget around €8000.",
  },
  {
    label: "Brand launch gala · 80 guests · royal hall",
    query:
      "Evening brand-launch gala for 80 seated guests. Royal or imperial setting, gilded and historical, ideally London, Vienna, or Venice. Catering and valet needed. Budget €15000.",
  },
  {
    label: "Period drama · gothic great hall · 2 days",
    query:
      "Two-day period drama shoot. Medieval or gothic great hall with stone walls — Prague, Kraków, or Bavaria. Lighting rig, 25 crew, picture vehicles on site. Budget €9000.",
  },
];

type Props = { onPick: (q: string) => void };

export default function ExampleChips({ onPick }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="label self-center mr-2">Try</span>
      {EXAMPLES.map((ex) => (
        <button
          key={ex.label}
          type="button"
          onClick={() => onPick(ex.query)}
          className="chip"
        >
          {ex.label}
        </button>
      ))}
    </div>
  );
}
