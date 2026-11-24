"use client";

import { useEffect, useRef } from "react";

interface YouTubePlayerInstance {
  getCurrentTime?: () => number;
  getDuration?: () => number;
  destroy?: () => void;
}

interface YouTubeNamespace {
  Player: new (
    element: HTMLElement | string,
    options: {
      videoId: string;
      host?: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number | undefined>;
      events?: {
        onReady?: (event: { target: YouTubePlayerInstance }) => void;
        onStateChange?: (event: { data: number; target: YouTubePlayerInstance }) => void;
      };
    },
  ) => YouTubePlayerInstance;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
  };
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<YouTubeNamespace> | null = null;

function loadYouTubeIframeApi(): Promise<YouTubeNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window unavailable"));
  }
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) {
    return ytApiPromise;
  }

  ytApiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error("YouTube Player API failed to initialize"));
      }
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        ytApiPromise = null;
        reject(new Error("Failed to load YouTube Player API"));
      };
      document.head.appendChild(script);
    }
  });

  return ytApiPromise;
}

export function YouTubeTrainingPlayer({
  videoId,
  title,
  initialSeconds = 0,
  autoplay = true,
  onProgress,
}: {
  videoId: string;
  title: string;
  initialSeconds?: number;
  autoplay?: boolean;
  onProgress: (payload: {
    watchedSeconds: number;
    durationSeconds: number | null;
    completed: boolean;
  }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    let active = true;
    let player: YouTubePlayerInstance | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const emitSnapshot = (target: YouTubePlayerInstance, completed = false) => {
      const rawCurrent = target.getCurrentTime?.() ?? 0;
      const rawDuration = target.getDuration?.() ?? 0;
      const durationSeconds = rawDuration > 0 ? Math.round(rawDuration) : null;
      const watchedSeconds = completed && durationSeconds
        ? durationSeconds
        : Math.max(0, Math.round(rawCurrent));
      onProgressRef.current({ watchedSeconds, durationSeconds, completed });
    };

    const clearPoll = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    void loadYouTubeIframeApi()
      .then((YT) => {
        if (!active || !containerRef.current) return;
        const mountNode = document.createElement("div");
        mountNode.className = "h-full w-full";
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(mountNode);

        player = new YT.Player(mountNode, {
          videoId,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            start: initialSeconds > 5 ? Math.floor(initialSeconds) : undefined,
            origin: window.location.origin,
          },
          events: {
            onReady: ({ target }) => {
              const rawDuration = target.getDuration?.() ?? 0;
              if (rawDuration > 0 && initialSeconds === 0) {
                onProgressRef.current({
                  watchedSeconds: 0,
                  durationSeconds: Math.round(rawDuration),
                  completed: false,
                });
              }
            },
            onStateChange: ({ data, target }) => {
              if (data === YT.PlayerState.PLAYING) {
                clearPoll();
                pollTimer = setInterval(() => emitSnapshot(target, false), 10000);
              } else if (data === YT.PlayerState.PAUSED) {
                clearPoll();
                emitSnapshot(target, false);
              } else if (data === YT.PlayerState.ENDED) {
                clearPoll();
                emitSnapshot(target, true);
              }
            },
          },
        });
      })
      .catch(() => {
        // Fallback to plain nocookie embed if IFrame API script is blocked
        if (!active || !containerRef.current) return;
        const params = new URLSearchParams({
          rel: "0",
          modestbranding: "1",
          autoplay: autoplay ? "1" : "0",
        });
        if (initialSeconds > 5) {
          params.set("start", String(Math.floor(initialSeconds)));
        }
        containerRef.current.innerHTML = `<iframe class="h-full w-full border-0" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}" title="${title.replace(/"/g, "&quot;")}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      });

    return () => {
      active = false;
      clearPoll();
      try {
        player?.destroy?.();
      } catch {
        // Ignore teardown errors on unmounted frames
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [videoId, title, autoplay, initialSeconds]);

  return (
    <div
      ref={containerRef}
      className="aspect-video w-full overflow-hidden rounded-xl bg-slate-950"
      aria-label={`Video player: ${title}`}
    />
  );
}
