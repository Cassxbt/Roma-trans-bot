import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type VoiceRecorderProps = {
  targetLanguages: Array<{ code: string; name: string }>;
  onTranscribe: (text: string) => void;
  onTranscribeComplete?: () => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
};

export function VoiceRecorder({
  targetLanguages,
  onTranscribe,
  onTranscribeComplete,
  onError,
  onLoading,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      // Setup audio analyser for visualisation
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus"
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunksRef.current.push(event.data);
      });

      mediaRecorder.addEventListener("stop", async () => {
        await handleRecordingComplete();
      });

      mediaRecorder.addEventListener("error", (event) => {
        onError(`Recording error: ${event.error}`);
        setIsRecording(false);
      });

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioURL(null);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      const message = err.name === "NotAllowedError" 
        ? "Microphone access denied. Please check browser permissions."
        : err.name === "NotFoundError"
        ? "No microphone found. Please connect a microphone."
        : err.message || "Unable to access microphone";
      onError(message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const handleRecordingComplete = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

    // Create preview URL
    const url = URL.createObjectURL(audioBlob);
    setAudioURL(url);

    // Create file from blob
    const audioFile = new File(
      [audioBlob],
      `voice-message-${Date.now()}.webm`,
      { type: "audio/webm" }
    );

    await uploadAndTranscribe(audioFile);
  };

  const uploadAndTranscribe = async (file: File) => {
    if (targetLanguages.length === 0) {
      onError("Please select at least one target language");
      return;
    }

    setIsUploading(true);
    onLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "target_languages",
        targetLanguages.map((l) => l.code).join(",")
      );
      formData.append("preserve_formatting", "true");

      const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
      const endpoint = `${API_BASE}/api/v1/voice-translate`;

      console.log(`🔄 Uploading to: ${endpoint}`);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(95);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // Fallback if response isn't JSON
          const text = await response.text();
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("✅ Transcription response:", data);
      
      setUploadProgress(100);
      
      // Verify we got transcribed text
      if (!data.transcribed_text) {
        throw new Error("No transcription received from server");
      }
      
      // Auto-clear preview after successful transcription
      setTimeout(() => {
        setAudioURL(null);
      }, 1000);
      
      onTranscribe(data.transcribed_text);
      onLoading(false);
      onTranscribeComplete?.();
      } catch (err: any) {
      console.error("❌ Upload error:", err);
      
      // Better error messages
      let message = "Transcription failed";
      
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        message = "Cannot reach translation server. Make sure the API is running on port 5000.";
      } else if (err.message.includes("HTTP")) {
        message = err.message;
      } else if (err.message) {
        message = err.message;
      }
      
      onError(message);
      onLoading(false);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file format
    const validMimeTypes = ["audio/wav", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/webm", "audio/flac"];
    const validExtensions = [".wav", ".mp3", ".m4a", ".ogg", ".webm", ".flac"];
    
    const hasValidMime = validMimeTypes.some((type) => file.type.includes(type));
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidMime && !hasValidExt) {
      onError("Unsupported audio format. Use: WAV, MP3, M4A, OGG, WEBM, FLAC");
      return;
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      onError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 50MB allowed.`);
      return;
    }

    await uploadAndTranscribe(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* Main Controls */}
      <div className="flex items-center gap-2">
        {/* Microphone Button */}
        <motion.button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isUploading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center justify-center w-12 h-12 rounded-lg font-medium transition-all ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50"
              : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
          title={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <svg className="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 16.91c-1.48 1.45-3.5 2.33-5.7 2.33-2.2 0-4.22-.88-5.7-2.33M19 21h2v-2h-2z" />
            </svg>
          )}
        </motion.button>

        {/* Recording Time Display */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg border border-red-200 dark:border-red-800"
            >
              🔴 {formatTime(recordingTime)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Button */}
        <motion.label
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center justify-center w-12 h-12 rounded-lg transition cursor-pointer ${
            isUploading
              ? "bg-gray-200 dark:bg-gray-600 cursor-not-allowed opacity-50"
              : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
          title="Upload audio file"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            disabled={isUploading || isRecording}
            className="hidden"
          />
          <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </motion.label>

        {/* Loading Indicator */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Progress Bar */}
      <AnimatePresence>
        {isUploading && uploadProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full"
          >
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {uploadProgress}% uploaded
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Preview */}
      <AnimatePresence>
        {audioURL && !isUploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
          >
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              📁 Ready to transcribe
            </div>
            <audio
              src={audioURL}
              controls
              className="w-full h-8 rounded"
              controlsList="nodownload"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>💡 Tip: Keep recordings under 2 minutes for best results</p>
        <p>📋 Formats: WAV, MP3, M4A, OGG, WEBM, FLAC (Max 50MB)</p>
      </div>
    </div>
  );
}
