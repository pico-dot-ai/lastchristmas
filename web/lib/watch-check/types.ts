export type MediaCandidate = {
  id: string;
  title: string;
  year: string;
  kind: string;
  artworkUrl: string;
  backdropUrl?: string;
  description?: string;
  source?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  originalQuery?: string;
};

export type WatchCheckResponse = {
  assessment: string;
  match: MediaCandidate;
  alternatives: MediaCandidate[];
  source: "rag" | "fallback";
};
