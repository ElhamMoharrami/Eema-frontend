"use client";

import { useEffect, useRef, useState } from "react";
import VenuePhoto from "./VenuePhoto";

type Props = {
  photoUrl: string;
  caption: string;
  videoSrc?: string; // /shoots/<id>.mp4
  enableVideoControl?: boolean;
  large?: boolean;
};

export default function GalleryFrame({
  photoUrl,
  caption,
  videoSrc,
  enableVideoControl = false,
  large = false,
}: Props) {
  // null = not probed yet, true = file exists, false = absent or failed
  const [videoOk, setVideoOk] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // HEAD-probe the file so we never render a broken player
  useEffect(() => {
    if (!enableVideoControl || !videoSrc) {
      setVideoOk(false);
      return;
    }
    let cancelled = false;
    setVideoOk(null);
    fetch(videoSrc, { method: "HEAD" })
      .then((r) => {
        if (cancelled) return;
        // Some hosts return 200 with non-video content-type; accept either way and
        // let the <video> onError fall us back to the still if playback fails.
        setVideoOk(r.ok);
      })
      .catch(() => {
        if (!cancelled) setVideoOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, [videoSrc, enableVideoControl]);

  const onPlay = () => {
    if (!videoOk || !videoSrc) return;
    setPlaying(true);
  };

  const onClose = () => {
    setPlaying(false);
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {
        // ignore — element may already be unmounted
      }
    }
  };

  // When the video mounts, kick off playback. Muted + playsInline lets browsers
  // honour autoplay after a user gesture without showing native chrome.
  useEffect(() => {
    if (!playing) return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = v.play();
    if (tryPlay && typeof tryPlay.catch === "function") {
      tryPlay.catch(() => {
        setPlaying(false);
        setVideoOk(false);
      });
    }
  }, [playing]);

  const ratio = large ? "16 / 10" : "4 / 3";

  return (
    <figure>
      <div className="mat">
        <span className="crop tl" />
        <span className="crop tr" />
        <span className="crop bl" />
        <span className="crop br" />
        <div
          className="relative overflow-hidden bg-paperDeep"
          style={{ aspectRatio: ratio }}
        >
          <VenuePhoto
            src={photoUrl}
            alt={caption}
            className={[
              "transition-opacity duration-700",
              playing && videoOk ? "opacity-0" : "opacity-100",
            ].join(" ")}
          />


          {playing && videoOk && videoSrc && (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover settle"
              src={videoSrc}
              poster={photoUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onError={() => {
                setPlaying(false);
                setVideoOk(false);
              }}
            />
          )}

          {/* Top-left plate marker while playing — a small editorial cue, not chrome */}
          {playing && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-2 bg-paper/90 px-2 py-1 text-[0.62rem] uppercase tracking-label text-ochre pointer-events-none">
              <span className="h-1.5 w-1.5 rounded-full bg-ochre animate-pulse" />
              Now playing
            </span>
          )}

          {/* The play / return-to-still pill — same anchor, both states */}
          {enableVideoControl && videoOk && (
            <button
              type="button"
              onClick={playing ? onClose : onPlay}
              className="absolute bottom-3 left-3 inline-flex items-center gap-2 bg-paper/90 px-3 py-1.5 text-[0.7rem] uppercase tracking-label text-ink hover:bg-paper transition-colors"
              aria-label={playing ? "Return to still photograph" : "See your shoot here"}
            >
              <span aria-hidden>{playing ? "■" : "▶"}</span>
              <span>{playing ? "Return to still" : "See your shoot here"}</span>
            </button>
          )}
        </div>
      </div>
      <figcaption className="mt-3 flex items-baseline justify-between gap-4">
        <span className="font-display text-base text-ink">{caption}</span>
      </figcaption>
    </figure>
  );
}
