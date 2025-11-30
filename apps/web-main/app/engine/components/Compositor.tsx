import { useMemo } from 'react';
import type { FC } from 'react';
import * as THREE from 'three';
import { useThree, createPortal, useFrame } from '@react-three/fiber';
import { useLayerManager } from '../LayerManager';

type Props = {
  offset?: [number, number];
  scale?: [number, number];
};

export const Compositor: FC<Props> = ({ offset = [0, 0], scale = [1, 1] }) => {
  const layers = useLayerManager((s) => s.layers);
  useThree();

  // Compositor Scene (Orthographic, Full Screen)
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

  // Shader source for final pass
  const vertexShader = useMemo(
    () => `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    []
  );

  const fragmentShader = useMemo(
    () => `
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
    []
  );

  useFrame(({ gl }) => {
    gl.setRenderTarget(null);
    gl.render(scene, camera);
  }, 1);

  return createPortal(
    <>
      {layers.map((layer) => {
        if (!layer.visible || !layer.fbo) return null;

        return (
          <mesh key={layer.id}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
              attach="material"
              vertexShader={vertexShader}
              fragmentShader={fragmentShader}
              uniforms={{
                tDiffuse: { value: layer.fbo.texture },
                uOpacity: { value: layer.opacity },
                uOffset: { value: new THREE.Vector2(offset[0], offset[1]) },
                uScale: { value: new THREE.Vector2(scale[0], scale[1]) },
              }}
              transparent={true}
              depthTest={false}
              depthWrite={false}
              blending={layer.blendMode === 'ADD' ? THREE.AdditiveBlending : THREE.NormalBlending}
            />
          </mesh>
        );
      })}
    </>,
    scene
  );
};
