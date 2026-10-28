import React, { useState, useRef } from 'react';
import { exportCanvasAsPNG, CanvasVideoRecorder } from '../lib/recorder';
import { Camera, Video, Download, X, Play, Square, Check } from 'lucide-react';

interface RecordExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  getCanvas: () => HTMLCanvasElement | null;
}

export const RecordExportModal: React.FC<RecordExportModalProps> = ({
  isOpen,
  onClose,
  getCanvas,
}) => {
  const [includeBg, setIncludeBg] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  const recorderRef = useRef<CanvasVideoRecorder>(new CanvasVideoRecorder());
  const autoStopTimeoutRef = useRef<number | null>(null);

  if (!isOpen) return null;

  const handleExportPNG = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    exportCanvasAsPNG(canvas, `motionlab-${Date.now()}.png`, includeBg);
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 2000);
  };

  const startRecording = (durationLimitSec?: number) => {
    const canvas = getCanvas();
    if (!canvas) return;

    setDownloadUrl(null);
    setRecordedSeconds(0);

    const started = recorderRef.current.startRecording(
      canvas,
      (sec) => setRecordedSeconds(sec),
      (blob, url) => {
        setDownloadUrl(url);
        setIsRecording(false);
      }
    );

    if (started) {
      setIsRecording(true);
      if (durationLimitSec) {
        autoStopTimeoutRef.current = window.setTimeout(() => {
          stopRecording();
        }, durationLimitSec * 1000);
      }
    }
  };

  const stopRecording = () => {
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    recorderRef.current.stopRecording();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-pink-400" />
            <h2 className="text-base font-semibold text-white">Capture & Export</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Screenshot PNG section */}
          <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>PNG High-Res Snapshot</span>
              </span>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBg}
                  onChange={(e) => setIncludeBg(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Include Background</span>
              </label>
            </div>
            <p className="text-xs text-slate-400">
              Captures current artwork frame at full display resolution.
            </p>
            <button
              onClick={handleExportPNG}
              className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
            >
              {snapshotTaken ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{snapshotTaken ? 'Saved to Downloads!' : 'Download PNG Snapshot'}</span>
            </button>
          </div>

          {/* Video Recording section */}
          <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Video className="w-4 h-4 text-pink-400" />
                <span>Motion Video Clip (WebM)</span>
              </span>
              {isRecording && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>{recordedSeconds.toFixed(1)}s</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Record 60FPS fluid video animation directly from the canvas stream.
            </p>

            {!isRecording ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => startRecording(5)}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Record 5s Clip</span>
                </button>
                <button
                  onClick={() => startRecording()}
                  className="py-2 px-3 bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors shadow-lg shadow-pink-600/20"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Manual</span>
                </button>
              </div>
            ) : (
              <button
                onClick={stopRecording}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-rose-600/20"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop Recording</span>
              </button>
            )}

            {downloadUrl && (
              <div className="pt-2 border-t border-slate-800/80">
                <a
                  href={downloadUrl}
                  download={`motionlab-video-${Date.now()}.webm`}
                  className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Recorded Video</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
