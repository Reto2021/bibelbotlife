import { useState, useRef, useCallback } from "react";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

export type TTSVoice = "male" | "female";

const VOICE_IDS: Record<TTSVoice, string> = {
  male: "onwK4e9ZLuTAKqWW03F9",   // Daniel – warm male
  female: "EXAVITQu4vr4xnSDxMaL",  // Sarah – warm female
};

const VOICE_STORAGE_KEY = "bibelbot-tts-voice";

export function getStoredVoice(): TTSVoice {
  try {
    const v = localStorage.getItem(VOICE_STORAGE_KEY);
    if (v === "male" || v === "female") return v;
  } catch {}
  return "male";
}

export function setStoredVoice(voice: TTSVoice) {
  try { localStorage.setItem(VOICE_STORAGE_KEY, voice); } catch {}
}

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voice, setVoiceState] = useState<TTSVoice>(getStoredVoice);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const setVoice = useCallback((v: TTSVoice) => {
    setVoiceState(v);
    setStoredVoice(v);
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(async (text: string) => {
    if (isPlaying) {
      stop();
      return;
    }

    const cleanText = text
      .replace(/[#*_~`>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim();

    if (!cleanText) return;

    setIsLoading(true);
    try {
      const currentVoice = getStoredVoice();
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: cleanText, voiceId: VOICE_IDS[currentVoice] }),
      });

      if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

      const blob = await response.blob();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      await audio.play();
      setIsPlaying(true);
    } catch (e) {
      console.error("TTS playback error:", e);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, stop]);

  return { play, stop, isPlaying, isLoading, voice, setVoice };
}
