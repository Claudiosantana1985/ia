import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { AudioRecorder } from "@/components/chat/audio-recorder";

type AudioRecorderProps = {
  onRecorded: (file: File) => void;
};

export function AudioRecorder({ onRecorded }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    try {
      console.log("Solicitando acesso ao microfone...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        console.log("Processando gravação...");

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        const file = new File(
          [blob],
          `gravacao-${Date.now()}.webm`,
          {
            type: recorder.mimeType || "audio/webm",
          },
        );

        console.log("Áudio criado:", file);

        onRecorded(file);

        streamRef.current?.getTracks().forEach((track) => {
          track.stop();
        });

        streamRef.current = null;
        mediaRecorderRef.current = null;
        chunksRef.current = [];

        setIsRecording(false);
      };

      recorder.start();

      setIsRecording(true);

      console.log("Gravação iniciada.");
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);

      setIsRecording(false);

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          alert(
            "Permissão para usar o microfone foi negada. Verifique as permissões do navegador."
          );
        }
      }
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (!recorder) {
      console.log("Nenhuma gravação ativa.");
      return;
    }

    if (recorder.state === "recording") {
      console.log("Parando gravação...");
      recorder.stop();
    }
  }

  function handleClick() {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isRecording ? "Parar gravação" : "Gravar áudio"}
      aria-label={isRecording ? "Parar gravação" : "Gravar áudio"}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-colors ${
        isRecording
          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {isRecording ? (
        <Square className="size-4 fill-current" />
      ) : (
        <Mic className="size-4" />
      )}
    </button>
  );
}