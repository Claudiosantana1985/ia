import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

type AudioRecorderProps = {
  onRecorded: (file: File) => void;
  disabled?: boolean;
};

export function AudioRecorder({
  onRecorded,
  disabled = false,
}: AudioRecorderProps) {
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
    if (disabled || isRecording) return;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Seu navegador não permite gravação de áudio.",
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        const file = new File(
          [blob],
          `gravacao-${Date.now()}.webm`,
          {
            type: blob.type,
          },
        );

        console.log("Áudio criado:", file);

        try {
          const formData = new FormData();

          formData.append("audio", file);

          console.log("Enviando áudio para /api/transcribe...");

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          console.log("Resposta da API de áudio:", data);

          if (!response.ok) {
            throw new Error(
              data?.error || "Não foi possível enviar o áudio.",
            );
          }

          console.log("Áudio enviado com sucesso.");
          alert("Áudio enviado para o servidor com sucesso!");

          onRecorded(file);
        } catch (error) {
          console.error("Erro ao enviar áudio:", error);
        }

        stream.getTracks().forEach((track) => track.stop());

        streamRef.current = null;
        mediaRecorderRef.current = null;
        chunksRef.current = [];

        setIsRecording(false);
      };

      recorder.onerror = (event) => {
        console.error("Erro no MediaRecorder:", event);

        stream.getTracks().forEach((track) => track.stop());

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

      streamRef.current?.getTracks().forEach((track) => track.stop());

      streamRef.current = null;
      mediaRecorderRef.current = null;
      chunksRef.current = [];
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      return;
    }

    console.log("Parando gravação...");

    recorder.stop();
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
      disabled={disabled}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
      aria-label={isRecording ? "Parar gravação" : "Gravar áudio"}
    >
      {isRecording ? (
        <>
          <Square className="size-4 fill-current" />
          Parar
        </>
      ) : (
        <>
          <Mic className="size-4" />
          Gravar
        </>
      )}
    </button>
  );
}