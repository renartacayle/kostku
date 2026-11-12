import React, { useState, useRef } from 'react';
import { ShoppingCart, Coffee, Package, Sparkles, Shirt, Droplets, Check, Plus } from 'lucide-react';
import { triggerCometArc } from '../../utils/cometArc';
import { useTheme } from '../../context/ThemeContext';

export default function CometArcCartShowcase({ onAddToCartGlobal = null }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // State for items in showcase
  const [items, setItems] = useState([
    {
      id: 'item-orbit-mug',
      name: 'Orbit Ceramic Mug',
      vendor: 'Lumo Studio x KostKu',
      price: 'Rp 45.000',
      icon: Coffee,
      iconColor: '#a855f7',
      cartCount: 1,
      badgeColor: '#ec4899',
      isGlowing: false
    },
    {
      id: 'item-laundry-express',
      name: 'Laundry Kilat 1 Hari',
      vendor: 'Mitra Laundry Bersih',
      price: 'Rp 15.000',
      icon: Shirt,
      iconColor: '#38bdf8',
      cartCount: 0,
      badgeColor: '#38bdf8',
      isGlowing: false
    },
    {
      id: 'item-galon-aqua',
      name: 'Air Galon Aqua Asli',
      vendor: 'Depot Barokah Kost',
      price: 'Rp 19.000',
      icon: Droplets,
      iconColor: '#06b6d4',
      cartCount: 0,
      badgeColor: '#06b6d4',
      isGlowing: false
    }
  ]);

  // Refs for buttons and cart targets
  const buttonRefs = useRef({});
  const cartRefs = useRef({});

  const handleAdd = (id) => {
    const btnEl = buttonRefs.current[id];
    const cartEl = cartRefs.current[id];

    if (!btnEl || !cartEl) return;

    // Trigger visual Comet Arc animation
    triggerCometArc({
      startEl: btnEl,
      targetEl: cartEl,
      color: '#38bdf8',
      duration: 620,
      onComplete: () => {
        // Increment item cart count
        setItems(prev => prev.map(item => {
          if (item.id === id) {
            return {
              ...item,
              cartCount: item.cartCount + 1,
              isGlowing: true
            };
          }
          return item;
        }));

        setTimeout(() => {
          setItems(prev => prev.map(item => item.id === id ? { ...item, isGlowing: false } : item));
        }, 600);

        if (onAddToCartGlobal) {
          onAddToCartGlobal(id);
        }
      }
    });
  };

  return (
    <div style={{
      width: '100%',
      padding: '1.25rem',
      borderRadius: '20px',
      background: isLight 
        ? 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)' 
        : 'linear-gradient(145deg, #0b1120 0%, #030712 100%)',
      border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(56, 189, 248, 0.2)',
      boxShadow: isLight 
        ? '0 10px 25px -5px rgba(0, 0, 0, 0.05)' 
        : '0 10px 30px -5px rgba(56, 189, 248, 0.1)',
      margin: '1.5rem 0'
    }}>
      {/* Header Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '100px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            <Sparkles size={12} /> Motion Preset: Comet Arc
          </span>
          <span style={{ fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 600 }}>
            Terinspirasi dari UI Motion Prompts (Part 3)
          </span>
        </div>

        <span style={{
          fontSize: '0.7rem',
          color: isLight ? '#0369a1' : '#7dd3fc',
          fontFamily: 'var(--font-mono)'
        }}>
          ✨ 2D Spring Physics & Ballistic Arc
        </span>
      </div>

      {/* Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '14px'
      }}>
        {items.map(item => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              style={{
                borderRadius: '16px',
                background: isLight ? '#ffffff' : '#0f172a',
                border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.3)',
                transition: 'border-color 0.2s ease, transform 0.2s ease'
              }}
            >
              {/* Top Row: Thumbnail + Info + Cart Icon */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '16px' }}>
                {/* Left: Thumbnail Icon */}
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  background: isLight ? 'rgba(56, 189, 248, 0.1)' : 'rgba(56, 189, 248, 0.12)',
                  border: isLight ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComp size={28} color={item.iconColor} />
                </div>

                {/* Center: Title & Vendor */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: isLight ? '#0f172a' : '#f8fafc',
                    lineHeight: 1.25,
                    marginBottom: '2px'
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: '0.74rem',
                    color: isLight ? '#64748b' : '#94a3b8',
                    marginBottom: '4px'
                  }}>
                    {item.vendor}
                  </div>
                  <div style={{
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    color: '#38bdf8',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {item.price}
                  </div>
                </div>

                {/* Right: Cart Target with Glow & Pop Badge */}
                <div
                  ref={el => (cartRefs.current[item.id] = el)}
                  data-cart-target={`cart-${item.id}`}
                  style={{
                    position: 'relative',
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: item.isGlowing 
                      ? 'rgba(56, 189, 248, 0.3)' 
                      : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)'),
                    border: item.isGlowing 
                      ? '1.5px solid #38bdf8' 
                      : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: item.isGlowing 
                      ? '0 0 16px rgba(56, 189, 248, 0.8)' 
                      : 'none',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  title="Keranjang Belanja"
                >
                  <ShoppingCart size={19} color={item.isGlowing ? '#38bdf8' : (isLight ? '#475569' : '#94a3b8')} />
                  
                  {item.cartCount > 0 && (
                    <span
                      key={item.cartCount}
                      className="comet-badge-pop"
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: item.badgeColor,
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        lineHeight: 1.3
                      }}
                    >
                      {item.cartCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom: "Add to cart" Trigger Button */}
              <button
                ref={el => (buttonRefs.current[item.id] = el)}
                type="button"
                onClick={() => handleAdd(item.id)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
                  transition: 'transform 0.12s ease, box-shadow 0.12s ease'
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Add to cart</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
