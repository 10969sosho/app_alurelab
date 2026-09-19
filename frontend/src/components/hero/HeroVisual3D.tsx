'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroVisual3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 600;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 26, 48);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Helper: Create circular dot texture for smooth points
    const createCircleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    };

    const dotTexture = createCircleTexture();

    // 1. TOPOLOGICAL WAVE PARTICLE FIELD
    const cols = 55;
    const rows = 45;
    const count = cols * rows;
    const separation = 1.6;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const originalPositions = new Float32Array(count * 3);

    const silverColor = new THREE.Color('#9FA4A8');
    const cloudColor = new THREE.Color('#D2D6DC');
    const limeColor = new THREE.Color('#C8FF3D');
    const charcoalColor = new THREE.Color('#2A2A2A');

    let i = 0;
    for (let ix = 0; ix < cols; ix++) {
      for (let iz = 0; iz < rows; iz++) {
        const x = (ix - cols / 2) * separation;
        const z = (iz - rows / 2) * separation;
        const y = 0;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;

        // Accent coloring: mostly soft silver/cloud, select sparse nodes highlighted in lime or charcoal
        const randomVal = Math.random();
        let pointColor = cloudColor;
        if (randomVal > 0.94) {
          pointColor = limeColor;
        } else if (randomVal > 0.88) {
          pointColor = charcoalColor;
        } else if (randomVal > 0.5) {
          pointColor = silverColor;
        }

        colors[i * 3] = pointColor.r;
        colors[i * 3 + 1] = pointColor.g;
        colors[i * 3 + 2] = pointColor.b;

        i++;
      }
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.4,
      map: dotTexture,
      transparent: true,
      opacity: 0.7,
      vertexColors: true,
      depthWrite: false,
    });

    const particleMesh = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleMesh);

    // 2. PRECISION GYROSCOPIC WIREFRAME RINGS
    const ringGroup = new THREE.Group();

    const ringMat1 = new THREE.LineBasicMaterial({
      color: 0x9FA4A8,
      transparent: true,
      opacity: 0.35,
    });

    const ringMatLime = new THREE.LineBasicMaterial({
      color: 0xC8FF3D,
      transparent: true,
      opacity: 0.55,
    });

    const createRing = (radius: number, segments = 64) => {
      const ringGeo = new THREE.BufferGeometry();
      const ringPoints: any[] = [];
      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      ringGeo.setFromPoints(ringPoints);
      return ringGeo;
    };

    const ring1 = new THREE.Line(createRing(15), ringMat1);
    const ring2 = new THREE.Line(createRing(22), ringMatLime);
    const ring3 = new THREE.Line(createRing(28), ringMat1);

    ring1.rotation.x = Math.PI / 4;
    ring2.rotation.z = Math.PI / 3;
    ring3.rotation.y = Math.PI / 6;

    ringGroup.add(ring1);
    ringGroup.add(ring2);
    ringGroup.add(ring3);
    ringGroup.position.y = 4;
    scene.add(ringGroup);

    // 3. MOUSE INTERACTION & DAMPING
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      targetX = (x / rect.width) * 0.4;
      targetY = (y / rect.height) * 0.3;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 4. ANIMATION LOOP
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Camera parallax
      camera.position.x = mouseX * 18;
      camera.position.y = 26 - mouseY * 12;
      camera.lookAt(0, 0, 0);

      // Undulating mathematical terrain wave
      const posAttr = particleGeometry.attributes.position;
      const posArray = posAttr.array as Float32Array;

      let idx = 0;
      for (let ix = 0; ix < cols; ix++) {
        for (let iz = 0; iz < rows; iz++) {
          const origX = originalPositions[idx * 3];
          const origZ = originalPositions[idx * 3 + 2];

          // Complex layered sine wave formula
          const wave1 = Math.sin(origX * 0.18 + elapsedTime * 1.2) * 2.2;
          const wave2 = Math.cos(origZ * 0.22 + elapsedTime * 1.0) * 2.0;
          const wave3 = Math.sin((origX + origZ) * 0.12 + elapsedTime * 0.8) * 1.5;

          posArray[idx * 3 + 1] = wave1 + wave2 + wave3;
          idx++;
        }
      }
      posAttr.needsUpdate = true;

      // Slow gyroscopic ring rotation
      ring1.rotation.y += 0.003;
      ring1.rotation.x += 0.002;
      ring2.rotation.z += 0.004;
      ring2.rotation.y += 0.002;
      ring3.rotation.x += 0.0025;
      ring3.rotation.z += 0.003;

      renderer.render(scene, camera);
    };

    animate();

    // 5. RESIZE LISTENER
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      particleGeometry.dispose();
      particleMaterial.dispose();
      dotTexture.dispose();
      ring1.geometry.dispose();
      ring2.geometry.dispose();
      ring3.geometry.dispose();
      ringMat1.dispose();
      ringMatLime.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none opacity-80 mix-blend-multiply"
      style={{
        maskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%)',
        WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%)',
      }}
    />
  );
}
