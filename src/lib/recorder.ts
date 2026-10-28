export function exportCanvasAsPNG(
  canvas: HTMLCanvasElement,
  filename: string = 'motionlab-artwork.png',
  includeBackground: boolean = true,
  bgColor: string = '#05070f'
) {
  if (!canvas) return;

  if (includeBackground) {
    // If the canvas itself already draws background, direct export works
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    // Create offscreen canvas without background fill
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export class CanvasVideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private startTime: number = 0;
  private timerInterval: number | null = null;

  public startRecording(
    canvas: HTMLCanvasElement,
    onTick?: (seconds: number) => void,
    onComplete?: (blob: Blob, url: string) => void
  ): boolean {
    if (this.isRecording) return false;
    this.recordedChunks = [];

    try {
      const stream = canvas.captureStream(60); // 60 FPS
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const options = selectedMime ? { mimeType: selectedMime } : undefined;
      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: selectedMime || 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        if (onComplete) {
          onComplete(blob, url);
        }
        if (this.timerInterval !== null) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        this.isRecording = false;
      };

      this.mediaRecorder.start(200); // 200ms slice
      this.isRecording = true;
      this.startTime = Date.now();

      if (onTick) {
        this.timerInterval = window.setInterval(() => {
          if (!this.isRecording) return;
          const elapsed = (Date.now() - this.startTime) / 1000;
          onTick(elapsed);
        }, 200);
      }

      return true;
    } catch {
      this.isRecording = false;
      return false;
    }
  }

  public stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  public getIsRecording() {
    return this.isRecording;
  }
}
