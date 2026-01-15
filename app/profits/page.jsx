'use client';

import NachosPokerNavBar from '@/components/NachosPokerNavBar';
import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Calculator, TrendingUp, Plus, Trash2, DollarSign, Clock, Layers } from 'lucide-react';

/**
 * Poker Profit Calculator Tool
 * 
 * Part of the FreeNachos App Suite
 * Calculates projected profits based on:
 * - Volume (hands or hours)
 * - Win rate (bb/100)
 * - Rakeback percentage
 * - Site/Stake combinations
 */

const PokerProfitCalculator = () => {
  // ============================================
  // DATA LAYER - Site rake data structure
  // ============================================
  
  const SITE_DATA = {
    pokerstars: {
      name: 'PokerStars',
      stakes: {
        '10nl': { rake: 10.5, bb: 0.10 },
        '25nl': { rake: 9.5, bb: 0.25 },
        '50nl': { rake: 9.0, bb: 0.50 },
        '100nl': { rake: 8.5, bb: 1.00 },
        '200nl': { rake: 7.5, bb: 2.00 },
        '500nl': { rake: 6.0, bb: 5.00 },
      }
    },
    ggpoker: {
      name: 'GGPoker',
      stakes: {
        '10nl': { rake: 12.0, bb: 0.10 },
        '25nl': { rake: 11.0, bb: 0.25 },
        '50nl': { rake: 10.5, bb: 0.50 },
        '100nl': { rake: 9.5, bb: 1.00 },
        '200nl': { rake: 8.5, bb: 2.00 },
        '500nl': { rake: 7.0, bb: 5.00 },
      }
    },
    partypoker: {
      name: 'PartyPoker',
      stakes: {
        '10nl': { rake: 11.0, bb: 0.10 },
        '25nl': { rake: 10.0, bb: 0.25 },
        '50nl': { rake: 9.5, bb: 0.50 },
        '100nl': { rake: 8.0, bb: 1.00 },
        '200nl': { rake: 7.0, bb: 2.00 },
        '500nl': { rake: 5.5, bb: 5.00 },
      }
    },
    acr: {
      name: 'ACR',
      stakes: {
        '10nl': { rake: 11.5, bb: 0.10 },
        '25nl': { rake: 10.5, bb: 0.25 },
        '50nl': { rake: 10.0, bb: 0.50 },
        '100nl': { rake: 9.0, bb: 1.00 },
        '200nl': { rake: 8.0, bb: 2.00 },
        '500nl': { rake: 6.5, bb: 5.00 },
      }
    },
    live: {
      name: 'Live Poker',
      stakes: {
        '1/2': { rake: 12.0, bb: 2.00 },
        '1/3': { rake: 10.0, bb: 3.00 },
        '2/5': { rake: 8.0, bb: 5.00 },
        '5/10': { rake: 6.0, bb: 10.00 },
        '10/20': { rake: 4.0, bb: 20.00 },
        '25/50': { rake: 3.0, bb: 50.00 },
      }
    }
  };

  const DEFAULT_HANDS_PER_HOUR = 30;

  // ============================================
  // STATE
  // ============================================
  
  const [mode, setMode] = useState('online'); // 'online' or 'live'
  const [volume, setVolume] = useState('');
  const [winRate, setWinRate] = useState('');
  const [rakeback, setRakeback] = useState('');
  const [handsPerHour, setHandsPerHour] = useState(DEFAULT_HANDS_PER_HOUR);
  const [selectedSite, setSelectedSite] = useState('pokerstars');
  const [selectedStake, setSelectedStake] = useState('50nl');
  const [scenarios, setScenarios] = useState([]);
  const [nachos, setNachos] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const nachoRef = useRef(null);

  // ============================================
  // CALCULATION LOGIC
  // ============================================
  
  const calculateProfit = (scenario) => {
    const { site, stake, volume, winRate, rakeback, mode, handsPerHour } = scenario;
    const siteData = SITE_DATA[site];
    const stakeData = siteData.stakes[stake];
    
    // Get base values
    const baseRake = stakeData.rake; // bb/100
    const bbValue = stakeData.bb; // $ value of big blind
    
    // Step 1: Calculate Rakeback Profit (bb/100)
    const rakebackBb100 = baseRake * (rakeback / 100);
    
    // Step 2: Calculate Total Win Rate (bb/100)
    const totalBb100 = parseFloat(winRate) + rakebackBb100;
    
    // Step 3: Calculate hands per month
    let handsPerMonth;
    if (mode === 'online') {
      handsPerMonth = parseFloat(volume);
    } else {
      // Live mode: convert hours to hands
      handsPerMonth = parseFloat(volume) * handsPerHour;
    }
    
    // Step 4: Calculate profit in bb per month
    const bbPerMonth = (totalBb100 / 100) * handsPerMonth;
    
    // Step 5: Convert to dollars
    const monthlyProfit = bbPerMonth * bbValue;
    
    // Step 6: Calculate other timeframes
    const dailyProfit = monthlyProfit / 30;
    const weeklyProfit = monthlyProfit / 4.33;
    const yearlyProfit = monthlyProfit * 12;
    
    return {
      daily: dailyProfit,
      weekly: weeklyProfit,
      monthly: monthlyProfit,
      yearly: yearlyProfit,
      totalBb100,
      rakebackBb100,
      baseRake,
      handsPerMonth
    };
  };

  // ============================================
  // HANDLERS
  // ============================================
  
  const addScenario = () => {
    if (!volume || !winRate || rakeback === '') return;
    
    const newScenario = {
      id: Date.now(),
      site: selectedSite,
      stake: selectedStake,
      volume: parseFloat(volume),
      winRate: parseFloat(winRate),
      rakeback: parseFloat(rakeback),
      mode,
      handsPerHour: mode === 'live' ? handsPerHour : null
    };
    
    setScenarios([...scenarios, newScenario]);
  };

  const removeScenario = (id) => {
    setScenarios(scenarios.filter(s => s.id !== id));
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

  const formatCurrency = (value, compact = false) => {
    const absValue = Math.abs(value);
    const sign = value >= 0 ? '+' : '-';
    
    // For very large numbers, use abbreviations
    if (absValue >= 1000000) {
      return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 10000) {
      return `${sign}$${(absValue / 1000).toFixed(1)}K`;
    }
    if (absValue >= 1000) {
      // For $1K-$10K, show whole dollars
      return `${sign}$${Math.round(absValue).toLocaleString('en-US')}`;
    }
    if (absValue >= 100) {
      // For $100-$999, show whole dollars
      return `${sign}$${Math.round(absValue).toLocaleString('en-US')}`;
    }
    // For smaller amounts, show cents
    return `${sign}$${absValue.toFixed(2)}`;
  };

  const getProfitColor = (value) => {
    if (value > 0) return '#22c55e';
    if (value < 0) return '#ef4444';
    return 'rgba(255,255,255,0.6)';
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
          outline: none;
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

        .input-field {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px 16px;
          color: #ffffff;
          font-size: 14px;
          width: 100%;
          box-sizing: border-box;
        }
        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .select-field {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px 16px;
          color: #ffffff;
          font-size: 14px;
          width: 100%;
          box-sizing: border-box;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 40px;
        }
        .select-field option {
          background: #1a1a1a;
          color: #ffffff;
        }

        .scenario-card {
          background: rgba(20, 20, 20, 0.8);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
          transition: all 0.3s ease;
        }
        .scenario-card:hover {
          border-color: rgba(255, 179, 71, 0.3);
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
              Know your numbers. <span style={{ color: 'rgba(255,255,255,0.5)' }}>Then grow them.</span>
            </h2>
            <p style={{fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '0', lineHeight: 1.5, maxWidth: '420px'}}>
              Calculate your expected profit — and discover how coaching could take your win rate to the next level.
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <Calculator size={28} color="#FFB347" />
            <h1 style={{
              textAlign: 'center', 
              fontSize: '2.2em', 
              margin: 0,
              color: '#ffffff',
              fontWeight: '700'
            }}>
              Poker Profit Calculator
            </h1>
          </div>
          <p style={{textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '30px'}}>
            Project your earnings based on volume, win rate, and rakeback
          </p>

          {/* Input Form */}
          <div style={{display: 'flex', gap: '24px', marginBottom: '40px', flexWrap: 'wrap'}}>
            {/* Mode Toggle */}
            <div className="glass-card" style={{
              flex: '1 1 200px',
              padding: '24px',
              borderRadius: '12px',
              animation: 'fadeIn 0.4s ease-out 0.2s both'
            }}>
              <h3 style={{color: '#FFB347', marginBottom: '16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Layers size={16} /> Mode
              </h3>
              <div style={{display: 'flex', gap: '10px'}}>
                <button 
                  className={`filter-btn ${mode === 'online' ? 'active' : ''}`}
                  onClick={() => setMode('online')}
                >
                  Online
                </button>
                <button 
                  className={`filter-btn ${mode === 'live' ? 'active' : ''}`}
                  onClick={() => setMode('live')}
                >
                  Live
                </button>
              </div>
            </div>

            {/* Volume Input */}
            <div className="glass-card" style={{
              flex: '1 1 250px',
              padding: '24px',
              borderRadius: '12px',
              animation: 'fadeIn 0.4s ease-out 0.25s both'
            }}>
              <h3 style={{color: '#FFB347', marginBottom: '16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Clock size={16} /> {mode === 'online' ? 'Hands / Month' : 'Hours / Month'}
              </h3>
              <input
                type="number"
                className="input-field input-focus"
                placeholder={mode === 'online' ? 'e.g., 50000' : 'e.g., 100'}
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
              />
              {mode === 'live' && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
                    Hands per Hour (default: 30)
                  </label>
                  <input
                    type="number"
                    className="input-field input-focus"
                    placeholder="30"
                    value={handsPerHour}
                    onChange={(e) => setHandsPerHour(parseInt(e.target.value) || DEFAULT_HANDS_PER_HOUR)}
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  />
                </div>
              )}
            </div>

            {/* Win Rate & Rakeback */}
            <div className="glass-card" style={{
              flex: '1 1 300px',
              padding: '24px',
              borderRadius: '12px',
              animation: 'fadeIn 0.4s ease-out 0.3s both'
            }}>
              <h3 style={{color: '#FFB347', marginBottom: '16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <TrendingUp size={16} /> Win Rate & Rakeback
              </h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
                    Win Rate (bb/100)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field input-focus"
                    placeholder="e.g., 3.5"
                    value={winRate}
                    onChange={(e) => setWinRate(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
                    Rakeback %
                  </label>
                  <input
                    type="number"
                    step="1"
                    className="input-field input-focus"
                    placeholder="e.g., 30"
                    value={rakeback}
                    onChange={(e) => setRakeback(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Site/Stake Selection */}
          <div className="glass-card" style={{
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '30px',
            animation: 'fadeIn 0.4s ease-out 0.35s both'
          }}>
            <h3 style={{color: '#FFB347', marginBottom: '20px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <DollarSign size={16} /> Add Site & Stake Scenario
            </h3>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
                  Site
                </label>
                <select
                  className="select-field input-focus"
                  value={selectedSite}
                  onChange={(e) => {
                    setSelectedSite(e.target.value);
                    setSelectedStake(Object.keys(SITE_DATA[e.target.value].stakes)[0]);
                  }}
                >
                  {Object.entries(SITE_DATA).map(([key, data]) => (
                    <option key={key} value={key}>{data.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
                  Stake
                </label>
                <select
                  className="select-field input-focus"
                  value={selectedStake}
                  onChange={(e) => setSelectedStake(e.target.value)}
                >
                  {Object.keys(SITE_DATA[selectedSite].stakes).map(stake => (
                    <option key={stake} value={stake}>{stake.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: '0 0 auto' }}>
                <button
                  className="btn-hover"
                  onClick={addScenario}
                  disabled={!volume || !winRate || rakeback === ''}
                  style={{
                    background: volume && winRate && rakeback !== '' ? '#FFB347' : 'rgba(255, 179, 71, 0.3)',
                    color: volume && winRate && rakeback !== '' ? '#0a0a0a' : 'rgba(0,0,0,0.5)',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: 'none',
                    cursor: volume && winRate && rakeback !== '' ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Plus size={18} /> Add Scenario
                </button>
              </div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              Base rake for {SITE_DATA[selectedSite].name} {selectedStake.toUpperCase()}: <span style={{ color: '#FFB347' }}>{SITE_DATA[selectedSite].stakes[selectedStake].rake} bb/100</span>
            </div>
          </div>

          {/* Results Section - Table Format */}
          {scenarios.length > 0 && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h3 style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <TrendingUp size={20} color="#FFB347" />
                Projected Profits
              </h3>
              
              {/* Table Container */}
              <div style={{ 
                overflowX: 'auto',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(20, 20, 20, 0.6)'
              }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  minWidth: '800px'
                }}>
                  {/* Table Header */}
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ 
                        padding: '14px 16px', 
                        textAlign: 'left', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: '#FFB347', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        background: 'rgba(255, 179, 71, 0.05)',
                        whiteSpace: 'nowrap'
                      }}>
                        Site / Stake
                      </th>
                      <th style={{ 
                        padding: '14px 12px', 
                        textAlign: 'center', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: 'rgba(255,255,255,0.5)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        background: 'rgba(255, 179, 71, 0.05)',
                        whiteSpace: 'nowrap'
                      }}>
                        Volume
                      </th>
                      <th style={{ 
                        padding: '14px 12px', 
                        textAlign: 'center', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: 'rgba(255,255,255,0.5)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        background: 'rgba(255, 179, 71, 0.05)',
                        whiteSpace: 'nowrap'
                      }}>
                        WR
                      </th>
                      <th style={{ 
                        padding: '14px 12px', 
                        textAlign: 'center', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: 'rgba(255,255,255,0.5)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        background: 'rgba(255, 179, 71, 0.05)',
                        whiteSpace: 'nowrap'
                      }}>
                        RB
                      </th>
                      <th style={{ 
                        padding: '14px 12px', 
                        textAlign: 'center', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: '#FFB347', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        background: 'rgba(255, 179, 71, 0.08)',
                        whiteSpace: 'nowrap'
                      }}>
                        Total
                      </th>
                      <th style={{ 
                        padding: '14px 12px', 
                        textAlign: 'center', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: 'rgba(255,255,255,0.5)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        background: 'rgba(255, 179, 71, 0.05)',
                        whiteSpace: 'nowrap'
                      }}>
                        Daily
                      </th>
                      <th style={{ 
                        padding: '14px 12px', 
                        textAlign: 'center', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: 'rgba(255,255,255,0.5)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        background: 'rgba(255, 179, 71, 0.05)',
                        whiteSpace: 'nowrap'
                      }}>
                        Weekly
                      </th>
                      <th style={{ 
                        padding: '14px 12px', 
                        textAlign: 'center', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: 'rgba(255,255,255,0.5)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        background: 'rgba(255, 179, 71, 0.05)',
                        whiteSpace: 'nowrap'
                      }}>
                        Monthly
                      </th>
                      <th style={{ 
                        padding: '14px 12px', 
                        textAlign: 'center', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: '#22c55e', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        background: 'rgba(34, 197, 94, 0.08)',
                        whiteSpace: 'nowrap'
                      }}>
                        Yearly
                      </th>
                      <th style={{ 
                        padding: '14px 8px', 
                        textAlign: 'center', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: 'rgba(255,255,255,0.3)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        background: 'rgba(255, 179, 71, 0.05)',
                        width: '40px'
                      }}>
                        
                      </th>
                    </tr>
                  </thead>
                  
                  {/* Table Body */}
                  <tbody>
                    {scenarios.map((scenario, index) => {
                      const results = calculateProfit(scenario);
                      const siteData = SITE_DATA[scenario.site];
                      const isLastRow = index === scenarios.length - 1;
                      
                      return (
                        <tr 
                          key={scenario.id}
                          style={{ 
                            borderBottom: isLastRow ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Site / Stake */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '13px' }}>
                              {siteData.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                              {scenario.stake.toUpperCase()}
                            </div>
                          </td>
                          
                          {/* Volume */}
                          <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                            <div style={{ fontWeight: '500', color: 'rgba(255,255,255,0.8)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                              {results.handsPerMonth >= 1000 
                                ? `${(results.handsPerMonth / 1000).toFixed(0)}K` 
                                : results.handsPerMonth.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                              hands
                            </div>
                          </td>
                          
                          {/* Win Rate */}
                          <td style={{ padding: '12px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <span style={{ 
                              fontWeight: '600', 
                              color: getProfitColor(scenario.winRate),
                              fontSize: '13px'
                            }}>
                              {scenario.winRate >= 0 ? '+' : ''}{scenario.winRate}
                            </span>
                          </td>
                          
                          {/* Rakeback */}
                          <td style={{ padding: '12px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <span style={{ 
                              fontWeight: '600', 
                              color: '#22c55e',
                              fontSize: '13px'
                            }}>
                              +{results.rakebackBb100.toFixed(1)}
                            </span>
                          </td>
                          
                          {/* Total WR */}
                          <td style={{ 
                            padding: '12px 12px', 
                            textAlign: 'center',
                            background: 'rgba(255, 179, 71, 0.05)',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{ 
                              fontWeight: '700', 
                              color: getProfitColor(results.totalBb100),
                              fontSize: '13px'
                            }}>
                              {results.totalBb100 >= 0 ? '+' : ''}{results.totalBb100.toFixed(1)}
                            </span>
                          </td>
                          
                          {/* Daily */}
                          <td style={{ padding: '12px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <span style={{ 
                              fontWeight: '600', 
                              color: getProfitColor(results.daily),
                              fontSize: '12px'
                            }}>
                              {formatCurrency(results.daily)}
                            </span>
                          </td>
                          
                          {/* Weekly */}
                          <td style={{ padding: '12px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <span style={{ 
                              fontWeight: '600', 
                              color: getProfitColor(results.weekly),
                              fontSize: '12px'
                            }}>
                              {formatCurrency(results.weekly)}
                            </span>
                          </td>
                          
                          {/* Monthly */}
                          <td style={{ padding: '12px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <span style={{ 
                              fontWeight: '600', 
                              color: getProfitColor(results.monthly),
                              fontSize: '13px'
                            }}>
                              {formatCurrency(results.monthly)}
                            </span>
                          </td>
                          
                          {/* Yearly */}
                          <td style={{ 
                            padding: '12px 12px', 
                            textAlign: 'center',
                            background: 'rgba(34, 197, 94, 0.03)',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{ 
                              fontWeight: '700', 
                              color: getProfitColor(results.yearly),
                              fontSize: '13px'
                            }}>
                              {formatCurrency(results.yearly)}
                            </span>
                          </td>
                          
                          {/* Delete Button */}
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <button
                              onClick={() => removeScenario(scenario.id)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '6px',
                                padding: '5px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                              }}
                            >
                              <Trash2 size={12} color="#ef4444" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  
                  {/* Table Footer - Totals */}
                  {scenarios.length > 1 && (
                    <tfoot>
                      <tr style={{ 
                        borderTop: '2px solid rgba(255, 179, 71, 0.3)',
                        background: 'rgba(255, 179, 71, 0.05)'
                      }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#FFB347', fontSize: '13px' }}>
                            TOTAL
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                            {scenarios.length} scenarios
                          </div>
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {(() => {
                            const totalHands = scenarios.reduce((sum, s) => sum + calculateProfit(s).handsPerMonth, 0);
                            return (
                              <span style={{ fontWeight: '600', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                                {totalHands >= 1000 ? `${(totalHands / 1000).toFixed(0)}K` : totalHands.toLocaleString()}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>—</span>
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>—</span>
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'center', background: 'rgba(255, 179, 71, 0.08)' }}>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>—</span>
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {(() => {
                            const total = scenarios.reduce((sum, s) => sum + calculateProfit(s).daily, 0);
                            return (
                              <span style={{ fontWeight: '700', color: getProfitColor(total), fontSize: '12px' }}>
                                {formatCurrency(total)}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {(() => {
                            const total = scenarios.reduce((sum, s) => sum + calculateProfit(s).weekly, 0);
                            return (
                              <span style={{ fontWeight: '700', color: getProfitColor(total), fontSize: '12px' }}>
                                {formatCurrency(total)}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {(() => {
                            const total = scenarios.reduce((sum, s) => sum + calculateProfit(s).monthly, 0);
                            return (
                              <span style={{ fontWeight: '700', color: getProfitColor(total), fontSize: '13px' }}>
                                {formatCurrency(total)}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'center', background: 'rgba(34, 197, 94, 0.08)', whiteSpace: 'nowrap' }}>
                          {(() => {
                            const total = scenarios.reduce((sum, s) => sum + calculateProfit(s).yearly, 0);
                            return (
                              <span style={{ fontWeight: '800', color: getProfitColor(total), fontSize: '14px' }}>
                                {formatCurrency(total)}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '12px 8px' }}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {scenarios.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px dashed rgba(255, 255, 255, 0.1)'
            }}>
              <Calculator size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                No scenarios added yet
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                Fill in the fields above and click "Add Scenario" to see your projected profits
              </div>
            </div>
          )}
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
              Understanding Your Numbers
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
                Rake is an Estimate
              </h3>
              <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.7, margin: 0}}>
                The rake values shown are averages — your actual rake depends on your playing style, table selection, and how often you see flops. Tighter players pay less rake.
              </p>
            </div>

            {/* Insight 2 */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <h3 style={{color: '#ef4444', fontSize: '14px', fontWeight: '600', marginBottom: '12px'}}>
                Use Your Real Rakeback %
              </h3>
              <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.7, margin: 0}}>
                Enter your <em>actual</em> rakeback percentage, not the advertised one. Sites like GGPoker advertise up to 60% but real returns are often much lower. Check your cashier history.
              </p>
            </div>

            {/* Insight 3 */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <h3 style={{color: '#60a5fa', fontSize: '14px', fontWeight: '600', marginBottom: '12px'}}>
                Site Selection Matters
              </h3>
              <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.7, margin: 0}}>
                Different sites have different rake structures and player pools. Compare scenarios across sites to find where your edge is maximized.
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
              <strong style={{color: '#FFB347'}}>Pro Tip:</strong> These projections assume a stable win rate. In reality, variance can cause significant short-term swings. 
              Focus on volume and continuous improvement — the math will work out over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokerProfitCalculator;
