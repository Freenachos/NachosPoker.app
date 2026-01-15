'use client';

import NachosPokerNavBar from '@/components/NachosPokerNavBar';
import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Fish, TrendingUp, AlertCircle, ChevronDown } from 'lucide-react';

/**
 * Poker Seat Selection EV Visualization Tool
 * 
 * Shows how reg win rates change based on:
 * - Site (PokerStars vs GGPoker)
 * - Fish VPIP range
 * - Table position relative to fish (who is always in EP)
 * 
 * Data structure is extensible - add more sites/scenarios by extending the winRateData object
 */

const PokerSeatEVTool = () => {
  // ============================================
  // DATA LAYER - Structured for extensibility
  // ============================================
  
  const winRateData = {
    pokerstars: {
      name: 'PokerStars',
      expectedWR: 3.2,
      // Fish is in EP, these are reg win rates by position
      positions: {
        MP: { '0-30': 4.4, '30-40': 4.5, '40-50': 6.7, '50+': 12.7 },
        CO: { '0-30': 1.1, '30-40': 1.2, '40-50': 3.4, '50+': 9.4 },
        BTN: { '0-30': -0.1, '30-40': 0.0, '40-50': 2.2, '50+': 5.0 },
        SB: { '0-30': 0.0, '30-40': 0.1, '40-50': 2.3, '50+': 5.1 },
        BB: { '0-30': 0.1, '30-40': 0.2, '40-50': 2.4, '50+': 8.4 }
      }
    },
    ggpoker: {
      name: 'GGPoker',
      expectedWR: -1.7,
      positions: {
        MP: { '0-30': -3.3, '30-40': -1.2, '40-50': 1.9, '50+': 7.9 },
        CO: { '0-30': -2.1, '30-40': -0.7, '40-50': 2.1, '50+': 7.2 },
        BTN: { '0-30': -1.2, '30-40': -1.7, '40-50': -0.25, '50+': 6.8 },
        SB: { '0-30': -6.0, '30-40': -2.5, '40-50': -0.26, '50+': 4.6 },
        BB: { '0-30': -1.9, '30-40': -3.0, '40-50': -0.22, '50+': 2.7 }
      }
    }
  };

  const vpipRanges = ['0-30', '30-40', '40-50', '50+'];
  const vpipLabels = {
    '0-30': '0–30 VPIP (Tight)',
    '30-40': '30–40 VPIP',
    '40-50': '40–50 VPIP',
    '50+': '50+ VPIP (Very Loose)'
  };

  // ============================================
  // STATE
  // ============================================
  
  const [selectedSite, setSelectedSite] = useState('pokerstars');
  const [selectedVpip, setSelectedVpip] = useState('40-50');
  const [nachos, setNachos] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const nachoRef = useRef(null);

  // ============================================
  // DERIVED DATA
  // ============================================
  
  const currentData = winRateData[selectedSite];
  const getWinRate = (position) => currentData.positions[position][selectedVpip];
  
  // Color coding logic for win rates
  const getWinRateColor = (wr) => {
    if (wr < -2) return { bg: 'rgba(239, 68, 68, 0.25)', border: 'rgba(239, 68, 68, 0.4)', text: '#ef4444' };
    if (wr < 0) return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.25)', text: '#f87171' };
    if (wr < 2) return { bg: 'rgba(255, 255, 255, 0.08)', border: 'rgba(255, 255, 255, 0.15)', text: 'rgba(255,255,255,0.8)' };
    if (wr < 5) return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.25)', text: '#4ade80' };
    return { bg: 'rgba(34, 197, 94, 0.25)', border: 'rgba(34, 197, 94, 0.4)', text: '#22c55e' };
  };

  // ============================================
  // NACHO MASCOT LOGIC (from original)
  // ============================================
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getEyeOffset = () => {
    if (!nachoRef.current) return { x: 0, y: 0 };
    const rect = nachoRef.current.getBoundingClientRect();
    const nachoCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    const angle = Math.atan2(mousePos.y - nachoCenter.y, mousePos.x - nachoCenter.x);
    const distance = Math.min(3, Math.hypot(mousePos.x - nachoCenter.x, mousePos.y - nachoCenter.y) / 50);
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  };

  useEffect(() => {
    const newNachos = Array.from({ length: 54 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 12 + Math.random() * 28,
      duration: 40 + Math.random() * 20,
      delay: Math.random() * 20,
      rotation: Math.random() * 360,
      opacity: 0.4 + Math.random() * 0.5,
      moveX: Math.random() * 200 - 100,
      moveY: Math.random() * 200 - 100
    }));
    setNachos(newNachos);
  }, []);

  const eyeOffset = getEyeOffset();

  // ============================================
  // COMPONENTS
  // ============================================

  const CartoonNacho = () => (
    <svg ref={nachoRef} width="90" height="90" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 4px 12px rgba(255, 179, 71, 0.4))' }}>
      <path d="M50 8 L88 85 Q90 92 82 92 L18 92 Q10 92 12 85 Z" fill="#FFB347" stroke="#E09A30" strokeWidth="2"/>
      <path d="M25 70 Q20 75 22 82 Q24 88 28 85 Q30 80 28 75 Z" fill="#FFD54F" opacity="0.9"/>
      <path d="M72 65 Q78 72 76 80 Q74 86 70 82 Q68 76 70 70 Z" fill="#FFD54F" opacity="0.9"/>
      <path d="M48 75 Q45 82 48 88 Q52 92 55 86 Q56 80 52 76 Z" fill="#FFD54F" opacity="0.9"/>
      <ellipse cx="50" cy="50" rx="22" ry="18" fill="#FFB347" />
      <ellipse cx="40" cy="48" rx="8" ry="9" fill="white" />
      <ellipse cx="60" cy="48" rx="8" ry="9" fill="white" />
      <circle cx={40 + eyeOffset.x} cy={48 + eyeOffset.y} r="4" fill="#1a1a1a" style={{ transition: 'cx 0.1s ease-out, cy 0.1s ease-out' }}/>
      <circle cx={60 + eyeOffset.x} cy={48 + eyeOffset.y} r="4" fill="#1a1a1a" style={{ transition: 'cx 0.1s ease-out, cy 0.1s ease-out' }}/>
      <circle cx={38 + eyeOffset.x * 0.5} cy={46 + eyeOffset.y * 0.5} r="1.5" fill="white" opacity="0.8" />
      <circle cx={58 + eyeOffset.x * 0.5} cy={46 + eyeOffset.y * 0.5} r="1.5" fill="white" opacity="0.8" />
      <path d="M38 62 Q50 72 62 62" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
      <path d="M33 38 Q40 35 47 38" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      <path d="M53 38 Q60 35 67 38" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="30" cy="30" r="2" fill="#E09A30" opacity="0.5" />
      <circle cx="70" cy="35" r="2.5" fill="#E09A30" opacity="0.5" />
      <circle cx="35" cy="80" r="2" fill="#E09A30" opacity="0.5" />
      <circle cx="65" cy="78" r="1.5" fill="#E09A30" opacity="0.5" />
    </svg>
  );

  const NachoTriangle = ({ size, opacity }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ opacity }}>
      <path d="M10 2 L18 17 L2 17 Z" fill="#FFB347" opacity="0.8"/>
    </svg>
  );

  // ============================================
  // TABLE GEOMETRY CONSTANTS
  // Strict elliptical coordinate system
  // ============================================
  
  const TABLE_CONFIG = {
    // Container dimensions
    containerWidth: 580,
    containerHeight: 420,
    // Table felt ellipse dimensions (matches the actual green felt)
    feltWidth: 400,
    feltHeight: 240,
    // Border thickness of table
    feltBorder: 8,
    // How much seat cards should overlap the table edge (negative = into table)
    overlapOffset: -12,
  };

  // Calculate seat position on ellipse perimeter
  // Returns {x, y} coordinates relative to container center
  const getEllipsePoint = (angleDegrees) => {
    const angleRad = (angleDegrees * Math.PI) / 180;
    // Radius to the EDGE of the felt (including border)
    const radiusX = (TABLE_CONFIG.feltWidth / 2) + TABLE_CONFIG.feltBorder + TABLE_CONFIG.overlapOffset;
    const radiusY = (TABLE_CONFIG.feltHeight / 2) + TABLE_CONFIG.feltBorder + TABLE_CONFIG.overlapOffset;
    
    return {
      x: radiusX * Math.cos(angleRad),
      y: radiusY * Math.sin(angleRad)
    };
  };

  // 6-max seat angles (in degrees, 0° = right, counterclockwise positive)
  // Evenly distributed at ~60° intervals
  const SEAT_ANGLES = {
    EP: 150,    // Upper-left (fish position)
    MP: 90,     // Top center
    CO: 30,     // Upper-right
    BTN: -30,   // Lower-right
    SB: -90,    // Bottom center
    BB: -150,   // Lower-left (same as 210°)
  };

  // Seat component for the poker table
  const Seat = ({ position, winRate, seatAngle, isEP = false }) => {
    const colors = isEP ? 
      { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', text: '#60a5fa' } : 
      getWinRateColor(winRate);
    
    // Calculate position on ellipse perimeter
    const { x, y } = getEllipsePoint(seatAngle);
    
    // Convert to absolute positioning (from container center)
    const centerX = TABLE_CONFIG.containerWidth / 2;
    const centerY = TABLE_CONFIG.containerHeight / 2;
    
    return (
      <div style={{
        position: 'absolute',
        // Position center of card on the ellipse perimeter
        left: `${centerX + x}px`,
        top: `${centerY + y}px`,
        // Center the card on its calculated point
        transform: 'translate(-50%, -50%)',
        // Visual styling
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        padding: isEP ? '12px 16px' : '14px 18px',
        minWidth: isEP ? '70px' : '85px',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        // Ensure seats layer above the table
        zIndex: 10,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {position}
        </div>
        {isEP ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Fish size={16} color={colors.text} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: colors.text }}>Fish</span>
          </div>
        ) : (
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: colors.text
          }}>
            {winRate >= 0 ? '+' : ''}{winRate.toFixed(1)}
          </div>
        )}
        {!isEP && (
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            bb/100
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div style={{minHeight: '100vh', background: '#0a0a0a', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
      {/* Floating Nachos Background */}
      <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1}}>
        {nachos.map(nacho => (
          <div
            key={nacho.id}
            style={{
              position: 'absolute',
              left: `${nacho.x}%`,
              top: `${nacho.y}%`,
              animation: `floatNacho ${nacho.duration}s ease-in-out infinite`,
              animationDelay: `${nacho.delay}s`,
              '--moveX': `${nacho.moveX}px`,
              '--moveY': `${nacho.moveY}px`
            }}
          >
            <NachoTriangle size={nacho.size} opacity={nacho.opacity} />
          </div>
        ))}
      </div>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @keyframes floatNacho {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(var(--moveX), var(--moveY)) rotate(180deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes traceBorder {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .glass-card {
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
        }
        .input-focus {
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .input-focus:focus {
          border-color: #FFB347 !important;
          box-shadow: 0 0 0 3px rgba(255, 179, 71, 0.15);
        }
        .btn-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .btn-hover:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .btn-hover:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .spark-border {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          background: #0a0a0a;
        }
        
        .spark-border::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 2px;
          background: linear-gradient(135deg, rgba(255, 179, 71, 0.3), rgba(255, 179, 71, 0.1));
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          z-index: 1;
          pointer-events: none;
        }
        
        .spark-border::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100px;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #FFB347 50%, #FFB347 100%);
          box-shadow: 0 0 10px 1px rgba(255, 179, 71, 0.6);
          offset-path: rect(0 100% 100% 0 round 16px);
          animation: traceBorder 5s linear infinite;
          offset-rotate: auto;
          offset-anchor: center;
          z-index: 2;
          pointer-events: none;
        }

        .filter-btn {
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .filter-btn.active {
          background: #FFB347;
          color: #0a0a0a;
          border-color: #FFB347;
        }
        .filter-btn:not(.active) {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
        }
        .filter-btn:not(.active):hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>

      <div style={{position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '20px'}}>
        <NachosPokerNavBar />
        
        {/* Header Banner */}
        <div 
          className="card-hover spark-border"
          style={{
            marginBottom: '30px',
            padding: '28px 32px',
            animation: 'fadeInUp 0.6s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '24px'
          }}
        >
          <div style={{ flexShrink: 0, animation: 'bounce 2s ease-in-out infinite' }}>
            <CartoonNacho />
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{fontSize: '12px', color: '#FFB347', fontWeight: '600', marginBottom: '6px', letterSpacing: '0.1em', textTransform: 'uppercase'}}>
              Crafted by FreeNachos
            </div>
            <h2 style={{fontSize: '22px', fontWeight: '700', color: '#ffffff', marginBottom: '8px', lineHeight: 1.2}}>
              See where the money really is.
            </h2>
            <p style={{fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '0', lineHeight: 1.5, maxWidth: '400px'}}>
              Optimize your seat selection with real data. Understand how fish position impacts your win rate.
            </p>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0}}>
            <a 
              href="https://www.nachospoker.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-hover"
              style={{
                background: '#FFB347',
                color: '#0a0a0a',
                padding: '12px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Join Our CFP <ExternalLink size={14} />
            </a>
            <a 
              href="https://www.freenachoscoaching.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-hover"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 179, 71, 0.5)',
                color: '#FFB347',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Private Coaching <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Main Tool Card */}
        <div 
          className="card-hover glass-card"
          style={{
            borderRadius: '16px', 
            padding: '40px', 
            marginBottom: '30px',
            animation: 'fadeInUp 0.6s ease-out 0.1s both'
          }}
        >
          <h1 style={{
            textAlign: 'center', 
            fontSize: '2.2em', 
            marginBottom: '8px', 
            color: '#ffffff',
            fontWeight: '700'
          }}>
            Seat Selection EV Tool
          </h1>
          <p style={{textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '30px'}}>
            How fish VPIP and position affect your win rate at 6-max
          </p>

          {/* Filters Section */}
          <div style={{display: 'flex', gap: '24px', marginBottom: '40px', flexWrap: 'wrap'}}>
            {/* Site Filter */}
            <div className="glass-card" style={{
              flex: '1 1 200px',
              padding: '24px',
              borderRadius: '12px',
              animation: 'fadeIn 0.4s ease-out 0.2s both'
            }}>
              <h3 style={{color: '#FFB347', marginBottom: '16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                Site
              </h3>
              <div style={{display: 'flex', gap: '10px'}}>
                <button 
                  className={`filter-btn ${selectedSite === 'pokerstars' ? 'active' : ''}`}
                  onClick={() => setSelectedSite('pokerstars')}
                >
                  PokerStars
                </button>
                <button 
                  className={`filter-btn ${selectedSite === 'ggpoker' ? 'active' : ''}`}
                  onClick={() => setSelectedSite('ggpoker')}
                >
                  GGPoker
                </button>
              </div>
            </div>

            {/* VPIP Filter */}
            <div className="glass-card" style={{
              flex: '2 1 400px',
              padding: '24px',
              borderRadius: '12px',
              animation: 'fadeIn 0.4s ease-out 0.3s both'
            }}>
              <h3 style={{color: '#FFB347', marginBottom: '16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                Fish VPIP Range
              </h3>
              <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                {vpipRanges.map(range => (
                  <button 
                    key={range}
                    className={`filter-btn ${selectedVpip === range ? 'active' : ''}`}
                    onClick={() => setSelectedVpip(range)}
                  >
                    {range === '50+' ? '50+' : range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content: Table + Stats */}
          <div style={{display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap'}}>
            {/* Poker Table Visualization */}
            <div style={{
              flex: '1 1 580px',
              position: 'relative',
              animation: 'fadeIn 0.5s ease-out 0.4s both'
            }}>
              {/* Table Container - centered with explicit dimensions */}
              <div style={{
                position: 'relative',
                width: `${TABLE_CONFIG.containerWidth}px`,
                height: `${TABLE_CONFIG.containerHeight}px`,
                margin: '0 auto'
              }}>
                {/* Table felt - centered in container */}
                <div style={{
                  position: 'absolute',
                  // Center the felt in the container
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  // Felt dimensions
                  width: `${TABLE_CONFIG.feltWidth}px`,
                  height: `${TABLE_CONFIG.feltHeight}px`,
                  // Visual styling
                  background: 'linear-gradient(145deg, #1a472a 0%, #0d2818 100%)',
                  borderRadius: '50%',
                  border: `${TABLE_CONFIG.feltBorder}px solid #2d1810`,
                  boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 10px 40px rgba(0,0,0,0.4)',
                  // Ensure table is below seats
                  zIndex: 1
                }}>
                  {/* Table center text */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em'}}>
                      6-Max
                    </div>
                    <div style={{fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '500'}}>
                      {currentData.name}
                    </div>
                  </div>
                </div>

                {/* Seats - positioned on ellipse perimeter with overlap */}
                {/* EP (Fish) - upper-left, 150° */}
                <Seat position="EP" winRate={0} seatAngle={SEAT_ANGLES.EP} isEP={true} />
                
                {/* MP - top center, 90° */}
                <Seat position="MP" winRate={getWinRate('MP')} seatAngle={SEAT_ANGLES.MP} />
                
                {/* CO - upper-right, 30° */}
                <Seat position="CO" winRate={getWinRate('CO')} seatAngle={SEAT_ANGLES.CO} />
                
                {/* BTN - lower-right, -30° */}
                <Seat position="BTN" winRate={getWinRate('BTN')} seatAngle={SEAT_ANGLES.BTN} />
                
                {/* SB - bottom center, -90° */}
                <Seat position="SB" winRate={getWinRate('SB')} seatAngle={SEAT_ANGLES.SB} />
                
                {/* BB - lower-left, -150° */}
                <Seat position="BB" winRate={getWinRate('BB')} seatAngle={SEAT_ANGLES.BB} />
              </div>

              {/* Scenario note */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px',
                padding: '10px 16px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                maxWidth: '400px',
                margin: '10px auto 0'
              }}>
                <AlertCircle size={14} color="#60a5fa" />
                <span style={{fontSize: '12px', color: 'rgba(255,255,255,0.6)'}}>
                  Scenario assumes the recreational player (fish) is in EP
                </span>
              </div>
            </div>

            {/* Stats Panel */}
            <div style={{
              flex: '0 0 280px',
              animation: 'fadeIn 0.5s ease-out 0.5s both'
            }}>
              {/* Expected WR Card */}
              <div className="glass-card" style={{
                padding: '28px',
                borderRadius: '12px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  Expected Win Rate
                </div>
                <div style={{
                  fontSize: '42px',
                  fontWeight: '700',
                  color: currentData.expectedWR >= 0 ? '#22c55e' : '#ef4444',
                  lineHeight: 1
                }}>
                  {currentData.expectedWR >= 0 ? '+' : ''}{currentData.expectedWR.toFixed(1)}
                </div>
                <div style={{fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginTop: '4px'}}>
                  bb/100 on {currentData.name}
                </div>
              </div>

              {/* Position Rankings */}
              <div className="glass-card" style={{
                padding: '24px',
                borderRadius: '12px'
              }}>
                <h4 style={{color: '#FFB347', marginBottom: '16px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  Position Rankings
                </h4>
                {Object.entries(currentData.positions)
                  .map(([pos, rates]) => ({ pos, wr: rates[selectedVpip] }))
                  .sort((a, b) => b.wr - a.wr)
                  .map(({ pos, wr }, idx) => {
                    const colors = getWinRateColor(wr);
                    return (
                      <div 
                        key={pos}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          marginBottom: '8px',
                          background: colors.bg,
                          borderRadius: '8px',
                          border: `1px solid ${colors.border}`
                        }}
                      >
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                          <span style={{
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.4)',
                            width: '18px'
                          }}>
                            #{idx + 1}
                          </span>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'rgba(255,255,255,0.9)'
                          }}>
                            {pos}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: colors.text
                        }}>
                          {wr >= 0 ? '+' : ''}{wr.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* VPIP Impact Note */}
              <div style={{
                marginTop: '16px',
                padding: '14px',
                background: 'rgba(255, 179, 71, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 179, 71, 0.2)'
              }}>
                <div style={{fontSize: '12px', color: '#FFB347', fontWeight: '600', marginBottom: '6px'}}>
                  {vpipLabels[selectedVpip]}
                </div>
                <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5}}>
                  {selectedVpip === '50+' && 'Very loose fish = maximum EV across all seats'}
                  {selectedVpip === '40-50' && 'Loose fish = solid EV, especially in position'}
                  {selectedVpip === '30-40' && 'Moderate fish = marginal gains for most regs'}
                  {selectedVpip === '0-30' && 'Tight fish = minimal edge, seat selection matters less'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div 
          className="glass-card"
          style={{
            borderRadius: '16px', 
            padding: '40px',
            animation: 'fadeInUp 0.6s ease-out 0.3s both'
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '28px'}}>
            <TrendingUp size={24} color="#FFB347" />
            <h2 style={{fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: 0}}>
              Key Insights
            </h2>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px'}}>
            {/* Insight 1 */}
            <div style={{
              background: 'rgba(255, 179, 71, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 179, 71, 0.2)'
            }}>
              <h3 style={{color: '#FFB347', fontSize: '14px', fontWeight: '600', marginBottom: '12px'}}>
                Position Matters Most
              </h3>
              <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.7, margin: 0}}>
                MP (direct position on fish) consistently yields the highest win rates. Being able to isolate and play in position against weak players is the biggest edge.
              </p>
            </div>

            {/* Insight 2 */}
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <h3 style={{color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '12px'}}>
                VPIP is Everything
              </h3>
              <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.7, margin: 0}}>
                A 50+ VPIP fish transforms a break-even table into a gold mine. The difference between 0-30 and 50+ VPIP fish can be 8-10 bb/100 in your win rate.
              </p>
            </div>

            {/* Insight 3 */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <h3 style={{color: '#ef4444', fontSize: '14px', fontWeight: '600', marginBottom: '12px'}}>
                Site Selection Impact
              </h3>
              <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.7, margin: 0}}>
                GGPoker's higher rake creates tougher conditions overall. Even with the same fish, your baseline expected WR is ~5 bb/100 lower than PokerStars.
              </p>
            </div>
          </div>

          <div style={{
            marginTop: '24px',
            padding: '18px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'center'
          }}>
            <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0, lineHeight: 1.7}}>
              <strong style={{color: '#FFB347'}}>Pro Tip:</strong> Don't just find fish — find <em>loose</em> fish and get direct position on them. 
              A tight fish in EP is worth almost nothing. A 50+ VPIP whale makes every seat at the table profitable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokerSeatEVTool;
