import { MediaCandidate } from "./types";

type TmdbResult = {
  id: number;
  media_type: "movie" | "tv" | "person" | string;
  title?: string;
  name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
};

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const TMDB_POSTER_SIZE = "w154";
const TMDB_BACKDROP_SIZE = "w780";

export async function searchTmdb(query: string): Promise<MediaCandidate[]> {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) {
    console.warn("TMDB_READ_TOKEN is missing; skipping TMDB search");
    return [];
  }

  const normalized = normalizeForTmdb(query);

  const url = new URL("https://api.themoviedb.org/3/search/multi");
  url.searchParams.set("query", normalized.cleanedQuery);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    console.warn("TMDB search failed", { status: res.status, statusText: res.statusText });
    return [];
  }

  const data = (await res.json()) as { results?: TmdbResult[] };
  const results = data.results ?? [];

  const first = results.find((item) => item.media_type === "movie" || item.media_type === "tv");
  if (!first) return [];

  const numbers = normalized.seasonEpisode ?? parseSeasonEpisode(query);

  return [toCandidate(query, numbers)(first, 0)];
}

function toCandidate(query: string, numbers?: { season?: number; episode?: number }) {
  return (item: TmdbResult, index: number): MediaCandidate => {
    const title = item.title || item.name || query;
    const yearSource = item.release_date || item.first_air_date;
    const year = yearSource ? new Date(yearSource).getFullYear().toString() : "Unknown";
    const posterPath = item.poster_path ? `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZE}${item.poster_path}` : "";
    const backdropPath = item.backdrop_path ? `${TMDB_IMAGE_BASE}/${TMDB_BACKDROP_SIZE}${item.backdrop_path}` : undefined;
    const kind = item.media_type === "movie" ? "Movie" : item.media_type === "tv" ? "TV Series" : "Media";
    const source = item.media_type === "movie" ? "movie" : item.media_type === "tv" ? "tv" : "";
    const sourceUrl = source ? `https://www.themoviedb.org/${source}/${item.id}` : undefined;

    return {
      id: item.id?.toString() ?? `tmdb-${index}`,
      title,
      year,
      kind,
      artworkUrl: posterPath,
      backdropUrl: backdropPath,
      description: item.overview,
      source: sourceUrl,
      seasonNumber: numbers?.season,
      episodeNumber: numbers?.episode,
      originalQuery: query,
    };
  };
}

function parseSeasonEpisode(query: string) {
  const normalized = query.toLowerCase();
  // Patterns like S02E03 or s2 e3
  const compact = normalized.match(/s(\d{1,2})\s*e(\d{1,3})/i);
  if (compact) {
    return {
      season: Number.parseInt(compact[1], 10),
      episode: Number.parseInt(compact[2], 10),
    };
  }

  const words = normalized.match(/season\s+(\d{1,2}).*episode\s+(\d{1,3})/i);
  if (words) {
    return {
      season: Number.parseInt(words[1], 10),
      episode: Number.parseInt(words[2], 10),
    };
  }

  const short = normalized.match(/season\s+(\d{1,2}).*ep\s+(\d{1,3})/i);
  if (short) {
    return {
      season: Number.parseInt(short[1], 10),
      episode: Number.parseInt(short[2], 10),
    };
  }

  const sEp = normalized.match(/s(\d{1,2})\s*ep\s*(\d{1,3})/i);
  if (sEp) {
    return {
      season: Number.parseInt(sEp[1], 10),
      episode: Number.parseInt(sEp[2], 10),
    };
  }

  return {};
}

function normalizeForTmdb(raw: string) {
  const cleaned = raw.trim();
  const seasonEpisode = parseSeasonEpisode(cleaned);
  // Remove explicit season/episode tokens to improve TMDB multi search hit rate
  const withoutSeasonEpisode = cleaned
    .replace(/s\d{1,2}\s*e\d{1,3}/gi, "")
    .replace(/s\d{1,2}\s*ep\s*\d{1,3}/gi, "")
    .replace(/season\s+\d{1,2}\s+episode\s+\d{1,3}/gi, "")
    .replace(/season\s+\d{1,2}\s+ep\s+\d{1,3}/gi, "")
    .replace(/\bep\s+\d{1,3}\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return { cleanedQuery: withoutSeasonEpisode || cleaned, seasonEpisode };
}
