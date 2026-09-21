"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;
  alt: string;
  monogramSource?: string; // text whose first letter becomes the monogram (default: alt)
  className?: string;
};

/**
 * Renders a venue photograph that degrades to a print-style monogram plate when
 * the image fails to load — so illustrative/pending photo URLs never show a
 * broken-image icon inside the gallery mat.
 */
export default function VenuePhoto({ src, alt, monogramSource, className }: Props) {
  const [broken, setBroken] = useState(false);

  // Reset when the URL changes so a new venue retries its image
  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (broken) {
    const letter = (monogramSource ?? alt).trim().charAt(0).toUpperCase() || "·";
    return (
      <div
        className={[
          "absolute inset-0 flex flex-col items-center justify-center bg-paperDeep px-6 text-center",
          className ?? "",
        ].join(" ")}
      >
        <span
          className="font-display leading-none text-ochre/55"
          style={{ fontSize: "clamp(4rem, 14vw, 9rem)" }}
        >
          {letter}
        </span>
        <span className="label mt-5 max-w-[80%] truncate">{alt}</span>
        <span className="label mt-1 text-taupe">Photograph pending</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      loading="lazy"
      className={["absolute inset-0 h-full w-full object-cover", className ?? ""].join(" ")}
    />
  );
}
