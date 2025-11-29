import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface DebugOverlayProps {
  texTop: THREE.DataTexture;
  texBottom: THREE.DataTexture;
  ledCount: number;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ texTop, texBottom, ledCount }) => {
  const { gl, size } = useThree();

  // --- 2D OVERLAY CANVAS ---
  // We use a pure HTML5 2D canvas overlay for debug rendering
  // This avoids fighting with the 3D scene composition
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
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

    // Append to document body to ensure it sits on top of everything
    document.body.appendChild(canvas);

    return () => {
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
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
    const drawStrip = (tex: THREE.DataTexture, y: number, label: string) => {
      const data = tex.image.data as Float32Array;
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

        // Simple max brightness for visualization
        const intensity = Math.max(r, g, b);
        const brightness = Math.min(255, Math.floor(intensity * 255));

        ctx.fillStyle = `rgb(${Math.min(255, r * 255)}, ${Math.min(255, g * 255)}, ${Math.min(255, b * 255)})`;
        ctx.fillRect(i * pixelWidth, y, pixelWidth + 0.5, barHeight); // +0.5 to avoid subpixel gaps
      }
    };

    // Draw Top (Row 1)
    drawStrip(texTop, 20, 'TOP CHANNEL');

    // Draw Bottom (Row 2)
    drawStrip(texBottom, 55, 'BOTTOM CHANNEL');
  });

  return <canvas ref={canvasRef} />;
};
