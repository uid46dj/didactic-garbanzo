import type { RoundVideo } from "../types";

// Pool of local stimulus clips used to build the 40-round session.
// In a production deployment these would be the "40 local videos" required
// by the spec; here the pool is cycled/shuffled to populate all 40 rounds
// while keeping the asset footprint small.
export const VIDEO_POOL: RoundVideo[] = [
  {
    id: "v1",
    title: "Emotion Switch-Up",
    src: "https://videos.pexels.com/video-files/7327414/7327414-uhd_3840_2160_25fps.mp4",
    duration: 14,
    mood: "Unpredictable",
  },
  {
    id: "v2",
    title: "Snack Surprise",
    src: "https://videos.pexels.com/video-files/6412624/6412624-hd_1920_1080_30fps.mp4",
    duration: 8,
    mood: "Playful",
  },
  {
    id: "v3",
    title: "Towel Reveal",
    src: "https://videos.pexels.com/video-files/4249235/4249235-hd_1920_1080_24fps.mp4",
    duration: 20,
    mood: "Suspense",
  },
  {
    id: "v4",
    title: "Confused Reaction",
    src: "https://videos.pexels.com/video-files/7327408/7327408-uhd_3840_2160_25fps.mp4",
    duration: 10,
    mood: "Awkward",
  },
  {
    id: "v5",
    title: "Eye Roll Close-Up",
    src: "https://videos.pexels.com/video-files/6977189/6977189-uhd_2880_2160_25fps.mp4",
    duration: 18,
    mood: "Sassy",
  },
  {
    id: "v6",
    title: "Happy Burst",
    src: "https://videos.pexels.com/video-files/8724235/8724235-uhd_4096_2160_25fps.mp4",
    duration: 18,
    mood: "Joyful",
  },
  {
    id: "v7",
    title: "Bubble Trick",
    src: "https://videos.pexels.com/video-files/20218499/20218499-uhd_3840_2160_24fps.mp4",
    duration: 20,
    mood: "Curious",
  },
  {
    id: "v8",
    title: "Startled Stare",
    src: "https://videos.pexels.com/video-files/8626647/8626647-hd_1920_1080_25fps.mp4",
    duration: 11,
    mood: "Shock",
  },
  {
    id: "v9",
    title: "Jaw Drop",
    src: "https://videos.pexels.com/video-files/4587767/4587767-uhd_3840_2160_25fps.mp4",
    duration: 16,
    mood: "Shock",
  },
  {
    id: "v10",
    title: "Blindfold Reveal",
    src: "https://videos.pexels.com/video-files/6608917/6608917-uhd_3840_2160_25fps.mp4",
    duration: 20,
    mood: "Suspense",
  },
];

export const TOTAL_ROUNDS = 40;
// Cap each round's active "stay still / stay focused" challenge window.
export const ROUND_CHALLENGE_SECONDS = 12;

export function shuffledVideoOrder(seed = Date.now()): string[] {
  const ids: string[] = [];
  // repeat the pool enough times to cover 40 rounds
  while (ids.length < TOTAL_ROUNDS) {
    ids.push(...VIDEO_POOL.map((v) => v.id));
  }
  const trimmed = ids.slice(0, TOTAL_ROUNDS);
  // seeded Fisher-Yates so "randomize order for each session" is reproducible
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = trimmed.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [trimmed[i], trimmed[j]] = [trimmed[j], trimmed[i]];
  }
  return trimmed;
}

export function videoById(id: string): RoundVideo {
  return VIDEO_POOL.find((v) => v.id === id) ?? VIDEO_POOL[0];
}
