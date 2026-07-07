import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    // Casual soft game background track
    const audio = new Audio('https://upload.wikimedia.org/wikipedia/commons/4/4b/Background_music_for_a_casual_game.ogg');
    audio.loop = true;
    audio.volume = 0.15; // Keeps the volume low as requested
    audioRef.current = audio;

    const playAudio = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.log('Autoplay blocked until user interacts', err);
        });
      }
    };

    // Autoplay policy: start on first user interaction
    document.addEventListener('click', playAudio, { once: true });
    document.addEventListener('keydown', playAudio, { once: true });
    document.addEventListener('touchstart', playAudio, { once: true });

    return () => {
      document.removeEventListener('click', playAudio);
      document.removeEventListener('keydown', playAudio);
      document.removeEventListener('touchstart', playAudio);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isPlaying]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !muted;
      setMuted(!muted);
      
      // If the user manually toggles it and it hasn't started playing yet, try to force play it
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  };

  return (
    <button 
      onClick={toggleMute} 
      className="fixed bottom-24 right-4 z-[999] p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]"
      title={muted ? "Unmute Music" : "Mute Music"}
    >
      {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-[#2cba00]" />}
    </button>
  );
}
