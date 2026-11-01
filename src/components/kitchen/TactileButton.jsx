import React from 'react';

/**
 * TactileButton - Inspired by "The Kitchen" by JP (dqnamo)
 * Physical compressible button with mechanical tactile depth & bevel highlights.
 */
export default function TactileButton({
  children,
  onClick,
  variant = 'emerald', // 'emerald' | 'primary' | 'whatsapp' | 'dark' | 'amber' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg'
  icon = null,
  disabled = false,
  className = '',
  style = {},
  type = 'button',
  ...props
}) {
  const configs = {
    emerald: {
      face: '#059669',
      faceHighlight: '#34d399',
      base: '#047857',
      baseShadow: '#064e3b',
      text: '#ffffff',
      depth: size === 'sm' ? '3px' : '5px'
    },
    primary: {
      face: '#2563eb',
      faceHighlight: '#60a5fa',
      base: '#1d4ed8',
      baseShadow: '#1e3a8a',
      text: '#ffffff',
      depth: size === 'sm' ? '3px' : '5px'
    },
    whatsapp: {
      face: '#16a34a',
      faceHighlight: '#4ade80',
      base: '#15803d',
      baseShadow: '#14532d',
      text: '#ffffff',
      depth: size === 'sm' ? '3px' : '5px'
    },
    dark: {
      face: '#1e293b',
      faceHighlight: '#475569',
      base: '#0f172a',
      baseShadow: '#020617',
      text: '#f8fafc',
      depth: size === 'sm' ? '3px' : '5px'
    },
    amber: {
      face: '#d97706',
      faceHighlight: '#fbbf24',
      base: '#b45309',
      baseShadow: '#78350f',
      text: '#ffffff',
      depth: size === 'sm' ? '3px' : '5px'
    },
    danger: {
      face: '#dc2626',
      faceHighlight: '#f87171',
      base: '#b91c1c',
      baseShadow: '#7f1d1d',
      text: '#ffffff',
      depth: size === 'sm' ? '3px' : '5px'
    }
  };

  const theme = configs[variant] || configs.emerald;

  const sizeStyles = {
    sm: { height: '32px', padding: '0 12px', fontSize: '0.78rem', borderRadius: '10px' },
    md: { height: '42px', padding: '0 18px', fontSize: '0.88rem', borderRadius: '12px' },
    lg: { height: '50px', padding: '0 24px', fontSize: '1rem', borderRadius: '14px' }
  }[size] || { height: '42px', padding: '0 18px', fontSize: '0.88rem', borderRadius: '12px' };

  return (
    <div
      className={`tactile-btn-wrapper ${className}`}
      style={{
        display: 'inline-block',
        position: 'relative',
        userSelect: 'none',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style
      }}
    >
      {/* 3D Compressible Base Extrusion */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          top: theme.depth,
          height: sizeStyles.height,
          borderRadius: sizeStyles.borderRadius,
          backgroundColor: theme.base,
          boxShadow: `0 3px 6px -1px rgba(0, 0, 0, 0.35), inset 0 -2px 0 ${theme.baseShadow}`,
          zIndex: 1
        }}
      />

      {/* Button Face (Moves down on press) */}
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="tactile-btn-face"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          height: sizeStyles.height,
          padding: sizeStyles.padding,
          fontSize: sizeStyles.fontSize,
          fontWeight: 700,
          color: theme.text,
          backgroundColor: theme.face,
          border: 'none',
          borderRadius: sizeStyles.borderRadius,
          boxShadow: `inset 0 1px 0 ${theme.faceHighlight}, 0 1px 2px rgba(0, 0, 0, 0.2)`,
          cursor: 'pointer',
          transition: 'transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)',
          transform: 'translateY(0)',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.transform = 'translateY(1px)';
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.transform = 'translateY(0)';
        }}
        onMouseDown={(e) => {
          if (!disabled) e.currentTarget.style.transform = `translateY(${theme.depth})`;
        }}
        onMouseUp={(e) => {
          if (!disabled) e.currentTarget.style.transform = 'translateY(1px)';
        }}
        onTouchStart={(e) => {
          if (!disabled) e.currentTarget.style.transform = `translateY(${theme.depth})`;
        }}
        onTouchEnd={(e) => {
          if (!disabled) e.currentTarget.style.transform = 'translateY(0)';
        }}
        {...props}
      >
        {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
        <span>{children}</span>
      </button>
    </div>
  );
}
