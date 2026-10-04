import React, { useRef, useEffect, useState } from 'react';
import { 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Eye, 
  Bed, 
  Bath, 
  Laptop, 
  Sparkles, 
  Info,
  Compass
} from 'lucide-react';

const PanoramaViewer360 = ({ roomName = 'Kamar Executive Deluxe 3x4m' }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [activeScene, setActiveScene] = useState('bedroom'); // 'bedroom' | 'bathroom' | 'workspace'
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(null);

  // Viewport camera parameters
  const yawRef = useRef(0); // horizontal angle in degrees (0 - 360)
  const pitchRef = useRef(0); // vertical angle in degrees (-45 to 45)
  const fovRef = useRef(75); // Field of view in degrees (45 to 100)
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animFrameIdRef = useRef(null);

  // Scene definitions with procedural realistic renderers & hotspots
  const scenes = {
    bedroom: {
      title: 'Kamar Utama (Aesthetic Co-Living)',
      icon: Bed,
      bgColor: '#1e293b',
      accentColor: '#38bdf8',
      hotspots: [
        { id: 1, yaw: 45, pitch: 0, label: 'Spring Bed Queen Size (160x200)', icon: '🛏️' },
        { id: 2, yaw: 135, pitch: 10, label: 'AC Daikin Inverter 1 PK Hemat Listrik', icon: '❄️' },
        { id: 3, yaw: 220, pitch: -10, label: 'Smart TV 43" 4K Netflix Ready', icon: '📺' },
        { id: 4, yaw: 310, pitch: -5, label: 'Lemari Pakaian 3 Pintu & Full Cermin', icon: '🚪' }
      ]
    },
    bathroom: {
      title: 'Kamar Mandi Dalam (Private En-Suite)',
      icon: Bath,
      bgColor: '#0f172a',
      accentColor: '#34d399',
      hotspots: [
        { id: 5, yaw: 60, pitch: 5, label: 'Water Heater Ariston Instant Warm', icon: '🚿' },
        { id: 6, yaw: 180, pitch: -15, label: 'Kloset Duduk Toto & Bidet Spray', icon: '🚽' },
        { id: 7, yaw: 300, pitch: 0, label: 'Wastafel Marmer & Cermin LED Touch', icon: '🪞' }
      ]
    },
    workspace: {
      title: 'Meja Kerja & Balkon Pribadi',
      icon: Laptop,
      bgColor: '#172554',
      accentColor: '#fbbf24',
      hotspots: [
        { id: 8, yaw: 90, pitch: -5, label: 'Meja Kerja Ergonomis & Kursi Hidrolik', icon: '💻' },
        { id: 9, yaw: 200, pitch: 5, label: 'WiFi Dedicated Mesh 100 Mbps', icon: '📶' },
        { id: 10, yaw: 340, pitch: 10, label: 'Pintu Sliding ke Balkon & Udara Segar', icon: '🌅' }
      ]
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let running = true;

    const renderLoop = () => {
      if (!running) return;

      // Handle auto rotation
      if (isAutoRotate && !isDraggingRef.current) {
        yawRef.current = (yawRef.current + 0.25) % 360;
      }

      drawScene(ctx, canvas.width, canvas.height);
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    const handleResize = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      running = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeScene, isAutoRotate]);

  // Procedural 360 room renderer
  const drawScene = (ctx, width, height) => {
    const yaw = yawRef.current;
    const pitch = pitchRef.current;
    const fov = fovRef.current;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Realistic Horizon and Room Walls Projection
    const horizonY = (height / 2) + (pitch * (height / 90));

    // Ceiling gradient
    const ceilGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    ceilGrad.addColorStop(0, '#0a0f1d');
    ceilGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(0, 0, width, horizonY);

    // Floor gradient (warm wooden vinyl)
    const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    if (activeScene === 'bathroom') {
      floorGrad.addColorStop(0, '#334155');
      floorGrad.addColorStop(1, '#1e293b'); // grey granite tiles
    } else {
      floorGrad.addColorStop(0, '#59381e');
      floorGrad.addColorStop(1, '#2c1808'); // teak wood parquet
    }
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // Wall Panels & Structural Pillars based on yaw
    const numWalls = 4;
    for (let i = 0; i < numWalls; i++) {
      const wallYaw = (i * 90);
      let diff = ((wallYaw - yaw + 540) % 360) - 180;
      const x = (width / 2) + (diff / (fov / 2)) * (width / 2);

      // Draw vertical architectural pillars
      if (x >= -50 && x <= width + 50) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(x - 4, 0, 8, height);

        // Warm Wall Sconce Lights on pillars
        const lightY = horizonY - 40;
        const radGrad = ctx.createRadialGradient(x, lightY, 2, x, lightY, 90);
        radGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        radGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.15)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(x, lightY, 90, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Floor Parquet Perspective Lines
    ctx.save();
    ctx.strokeStyle = activeScene === 'bathroom' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1.5;
    for (let deg = -60; deg <= 60; deg += 15) {
      const startX = (width / 2) + Math.tan((deg + (yaw % 15)) * Math.PI / 180) * 150;
      ctx.beginPath();
      ctx.moveTo(startX, horizonY);
      const endX = (width / 2) + Math.tan((deg + (yaw % 15)) * Math.PI / 180) * (height);
      ctx.lineTo(endX, height);
      ctx.stroke();
    }
    ctx.restore();

    // Render 360 Interactive Hotspots
    const curScene = scenes[activeScene];
    curScene.hotspots.forEach(hs => {
      let diff = ((hs.yaw - yaw + 540) % 360) - 180;
      if (Math.abs(diff) < fov / 1.5) {
        const x = (width / 2) + (diff / (fov / 2)) * (width / 2);
        const y = horizonY - (hs.pitch * (height / 90)) - 20;

        // Draw pulsing beacon ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon circle
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();

        // Text / Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hs.icon, x, y);

        // Tooltip badge
        const badgeW = ctx.measureText(hs.label).width + 24;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x - (badgeW / 2), y - 36, badgeW, 22, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px system-ui';
        ctx.fillText(hs.label, x, y - 25);

        ctx.restore();
      }
    });

    // Compass indicator at top-left
    ctx.save();
    ctx.translate(50, 45);
    ctx.rotate(-(yaw * Math.PI) / 180);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -18);
    ctx.stroke();
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 18);
    ctx.stroke();
    ctx.restore();
  };

  // Drag Handlers (Touch + Mouse)
  const onPointerDown = (clientX, clientY) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: clientX, y: clientY };
  };

  const onPointerMove = (clientX, clientY) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - lastMousePosRef.current.x;
    const dy = clientY - lastMousePosRef.current.y;

    yawRef.current = (yawRef.current - dx * 0.35 + 360) % 360;
    pitchRef.current = Math.max(-40, Math.min(40, pitchRef.current + dy * 0.25));

    lastMousePosRef.current = { x: clientX, y: clientY };
  };

  const onPointerUp = () => {
    isDraggingRef.current = false;
  };

  const zoomIn = () => {
    fovRef.current = Math.max(45, fovRef.current - 10);
  };

  const zoomOut = () => {
    fovRef.current = Math.min(95, fovRef.current + 10);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: isFullscreen ? '100vh' : '460px',
        borderRadius: isFullscreen ? '0px' : '20px',
        overflow: 'hidden',
        background: '#090d16',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        border: isFullscreen ? 'none' : '1px solid rgba(59, 130, 246, 0.3)',
        userSelect: 'none'
      }}
    >
      {/* 360 Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={e => onPointerDown(e.clientX, e.clientY)}
        onMouseMove={e => onPointerMove(e.clientX, e.clientY)}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={e => onPointerDown(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e => onPointerMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={onPointerUp}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
      />

      {/* Top Floating Bar: Scene Switcher */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'none'
      }}>
        {/* Left: 360 Live Badge */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '6px 12px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'auto'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 10px #22c55e'
          }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>
            360° IMMERSIVE TOUR
          </span>
        </div>

        {/* Center: Scene Tabs */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '4px',
          borderRadius: '12px',
          display: 'flex',
          gap: '4px',
          pointerEvents: 'auto'
        }}>
          {Object.entries(scenes).map(([key, sc]) => {
            const Icon = sc.icon;
            const isActive = activeScene === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveScene(key)}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'transparent',
                  border: 'none',
                  color: isActive ? 'white' : '#94a3b8',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={14} />
                <span className="hidden-xs">{key === 'bedroom' ? 'Kamar Tidur' : key === 'bathroom' ? 'Kamar Mandi' : 'Workspace'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Center Cue (Disappears on touch) */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '6px 14px',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#cbd5e1',
        fontSize: '0.75rem',
        pointerEvents: 'none'
      }}>
        <Compass size={14} color="#38bdf8" />
        <span>Geser layar / sentuh untuk melihat sekeliling 360°</span>
      </div>

      {/* Floating Control Buttons (Right Side) */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button
          type="button"
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          title={isAutoRotate ? 'Jeda Putar Otomatis' : 'Mulai Putar Otomatis'}
          style={{
            background: isAutoRotate ? '#3b82f6' : 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            borderRadius: '10px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <RotateCw size={16} />
        </button>

        <button
          type="button"
          onClick={zoomIn}
          title="Perbesar View"
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            borderRadius: '10px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ZoomIn size={16} />
        </button>

        <button
          type="button"
          onClick={zoomOut}
          title="Perkecil View"
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            borderRadius: '10px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ZoomOut size={16} />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            borderRadius: '10px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

    </div>
  );
};

export default PanoramaViewer360;
