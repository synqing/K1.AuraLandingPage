import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { DataTexture } from 'three';

interface DebugOverlayProps {
  texTop: DataTexture;
  texBottom: DataTexture;
  ledCount: number;
}

export const DebugOverlay = ({ texTop, texBottom, ledCount }: DebugOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.bottom = '20px';
    canvas.style.right = '20px';
    canvas.style.width = '320px';
    canvas.style.height = '80px';
    canvas.style.zIndex = '9999';
    canvas.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    canvas.style.pointerEvents = 'none';
    canvas.width = 320;
    canvas.height = 80;
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    return () => {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      canvasRef.current = null;
    };
  }, []);

  useFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- DRAW HELPERS ---
    const drawStrip = (tex: DataTexture, y: number, label: string) => {
      const data = tex.image.data as unknown as Float32Array;
      const stride = 4; // RGBA
      const width = canvas.width;
      const barHeight = 20;

      // Draw Label
      ctx.fillStyle = '#888';
      ctx.font = '10px monospace';
      ctx.fillText(label, 5, y - 4);

      // Draw Pixels
      const pixelWidth = width / ledCount;

      for (let i = 0; i < ledCount; i++) {
        const idx = i * stride;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        ctx.fillStyle = `rgb(${Math.min(255, r * 255)}, ${Math.min(255, g * 255)}, ${Math.min(255, b * 255)})`;
        ctx.fillRect(i * pixelWidth, y, pixelWidth + 0.5, barHeight); // +0.5 to avoid subpixel gaps
      }
    };

    // Draw Top (Row 1)
    drawStrip(texTop, 20, 'TOP CHANNEL');

    // Draw Bottom (Row 2)
    drawStrip(texBottom, 55, 'BOTTOM CHANNEL');
  });

  return null;
};
