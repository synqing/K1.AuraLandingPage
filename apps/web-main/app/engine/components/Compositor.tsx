import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useThree, createPortal, useFrame } from '@react-three/fiber';
import { useLayerManager } from '../LayerManager';

type Props = {
  offset?: [number, number];
  scale?: [number, number];
};

export const Compositor: React.FC<Props> = ({ offset = [0, 0], scale = [1, 1] }) => {
  const layers = useLayerManager((s) => s.layers);
  const { size } = useThree();

  // Compositor Scene (Orthographic, Full Screen)
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

  // Simple additive blend shader for the final pass
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uOpacity: { value: 1.0 },
        uOffset: { value: new THREE.Vector2(0, 0) },
        uScale: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uOpacity;
        uniform vec2 uOffset;
        uniform vec2 uScale;
        varying vec2 vUv;
        void main() {
          vec2 uvp = (vUv - uOffset) / uScale;
          if (uvp.x < 0.0 || uvp.x > 1.0 || uvp.y < 0.0 || uvp.y > 1.0) {
            discard;
          }
          vec4 tex = texture2D(tDiffuse, uvp);
          gl_FragColor = tex * uOpacity;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  useFrame(({ gl }) => {
    gl.setRenderTarget(null);
    gl.render(scene, camera);
  });

  return createPortal(
    <>
      {layers.map((layer) => {
        if (!layer.visible || !layer.fbo) return null;

        return (
          <mesh key={layer.id}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
              attach="material"
              args={[material]}
              uniforms-tDiffuse-value={layer.fbo.texture}
              uniforms-uOpacity-value={layer.opacity}
              uniforms-uOffset-value={new THREE.Vector2(offset[0], offset[1])}
              uniforms-uScale-value={new THREE.Vector2(scale[0], scale[1])}
              transparent={true}
              blending={layer.blendMode === 'ADD' ? THREE.AdditiveBlending : THREE.NormalBlending}
            />
          </mesh>
        );
      })}
    </>,
    scene
  );
};
