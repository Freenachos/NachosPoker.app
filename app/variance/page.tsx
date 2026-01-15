'use client';

import NachosPokerNavBar from '@/components/NachosPokerNavBar';
import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, X, ExternalLink, HelpCircle, TrendingUp, Target, BarChart3, ChevronDown, ChevronUp, Settings } from 'lucide-react';

const PokerEVSimulation = () => {
  const [parameters, setParameters] = useState({
    winrate: 4,
    observedWinrate: 10,
    stdDev: 90,
    numHands: 100000,
    numSamples: 20,
    stakeWeights: [{ 
      stake: '25nl', 
      weight: 100, 
      volumeType: 'percentage',
      customWinrate: 4,
      customStdDev: 90
    }]
  });
  
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [displayInDollars, setDisplayInDollars] = useState(true);
  const [hoveredSample, setHoveredSample] = useState(null);
  const [nachos, setNachos] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const nachoRef = useRef(null);

  // Fix viewport scaling for mobile
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
    document.getElementsByTagName('head')[0].appendChild(meta);
  }, []);

  // Max limits to prevent breaking
  const MAX_HANDS = 10000000;
  const MAX_SAMPLES = 100;
  const MAX_SAMPLEHANDS = 100000000;

  // Calculate current samplehands and check if over limit
  const samplehands = parameters.numSamples * parameters.numHands;
  const isOverLimit = samplehands > MAX_SAMPLEHANDS;

  const stakes = [
    { value: '5nl', label: '5NL', bb: 0.05 },
    { value: '10nl', label: '10NL', bb: 0.10 },
    { value: '25nl', label: '25NL', bb: 0.25 },
    { value: '50nl', label: '50NL', bb: 0.50 },
    { value: '100nl', label: '100NL', bb: 1.00 },
    { value: '200nl', label: '200NL', bb: 2.00 },
    { value: '500nl', label: '500NL', bb: 5.00 },
    { value: '1000nl', label: '1000NL', bb: 10.00 },
    { value: '2000nl', label: '2000NL', bb: 20.00 },
    { value: '5000nl', label: '5000NL', bb: 50.00 }
  ];

  // Track mouse position for nacho eyes
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate eye position based on mouse
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

  // Initialize floating nachos
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

  const getWeightedAverageBB = () => {
    const totalWeight = parameters.stakeWeights.reduce((sum, sw) => sum + (sw.weight || 0), 0);
    if (totalWeight === 0) return 0.25;
    const weightedSum = parameters.stakeWeights.reduce((sum, sw) => {
      const stake = stakes.find(s => s.value === sw.stake);
      return sum + (stake ? stake.bb * (sw.weight || 0) : 0);
    }, 0);
    return weightedSum / totalWeight;
  };

  const getWeightedAverageWinrate = () => {
    const totalWeight = parameters.stakeWeights.reduce((sum, sw) => sum + (sw.weight || 0), 0);
    if (totalWeight === 0) return parameters.winrate;
    const weightedSum = parameters.stakeWeights.reduce((sum, sw) => {
      return sum + ((sw.customWinrate || 0) * (sw.weight || 0));
    }, 0);
    return weightedSum / totalWeight;
  };

  const getWeightedAverageStdDev = () => {
    const totalWeight = parameters.stakeWeights.reduce((sum, sw) => sum + (sw.weight || 0), 0);
    if (totalWeight === 0) return parameters.stdDev;
    const weightedSum = parameters.stakeWeights.reduce((sum, sw) => {
      return sum + ((sw.customStdDev || 0) * (sw.weight || 0));
    }, 0);
    return weightedSum / totalWeight;
  };

  // Calculate bankroll requirements using Risk of Ruin formula
  // B = (σ² / (-2 * WR)) * ln(RoR)
  const calculateBankrollRequirement = (riskOfRuin) => {
    const avgWinrate = getWeightedAverageWinrate();
    const avgStdDev = getWeightedAverageStdDev();
    const avgBB = getWeightedAverageBB();
    
    // Convert to per-hand values (from BB/100)
    const wrPerHand = avgWinrate / 100;
    const stdDevPerHand = avgStdDev / Math.sqrt(100);
    
    if (wrPerHand <= 0) {
      return { bb: Infinity, dollars: Infinity };
    }
    
    // Formula: B = (σ² / (2 * WR)) * ln(1/RoR)
    const bankrollBB = (Math.pow(stdDevPerHand, 2) / (2 * wrPerHand)) * Math.log(1 / riskOfRuin);
    const bankrollDollars = bankrollBB * avgBB;
    
    return {
      bb: Math.ceil(bankrollBB),
      dollars: Math.ceil(bankrollDollars)
    };
  };

  const bankrollProfiles = [
    { name: 'Aggressive Nacho', ror: 0.10, emoji: '😤', description: 'High-risk shot-taker' },
    { name: 'Basic Nacho', ror: 0.05, emoji: '🙂', description: 'Industry standard' },
    { name: 'Pro Nacho', ror: 0.01, emoji: '🤠', description: 'Serious grinder' },
    { name: 'Nit Nacho', ror: 0.001, emoji: '😰', description: 'Bulletproof bankroll' }
  ];

  const addStake = () => {
    setParameters({
      ...parameters,
      stakeWeights: [...parameters.stakeWeights, { 
        stake: '25nl', 
        weight: 0, 
        volumeType: 'percentage',
        customWinrate: parameters.winrate,
        customStdDev: parameters.stdDev
      }]
    });
  };

  const removeStake = (index) => {
    if (parameters.stakeWeights.length > 1) {
      const newWeights = parameters.stakeWeights.filter((_, i) => i !== index);
      setParameters({ ...parameters, stakeWeights: newWeights });
    }
  };

  const updateStakeWeight = (index, field, value) => {
    const newWeights = [...parameters.stakeWeights];
    newWeights[index] = { ...newWeights[index], [field]: value };
    setParameters({ ...parameters, stakeWeights: newWeights });
  };

  const handleHandsChange = (value) => {
    const numValue = parseInt(value) || 0;
    setParameters({...parameters, numHands: Math.min(numValue, MAX_HANDS)});
  };

  const handleSamplesChange = (value) => {
    const numValue = parseInt(value) || 0;
    setParameters({...parameters, numSamples: Math.min(numValue, MAX_SAMPLES)});
  };

  const normalRandom = () => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  const monteCarloSimulation = (numHands, numSamples, stakeWeights) => {
    // Memory guard - check limit first
    const totalOps = numSamples * numHands;
    if (totalOps > MAX_SAMPLEHANDS) {
      return null;
    }

    // Build stake pool with individual winrates and std devs
    const stakePool = [];
    const totalWeight = stakeWeights.reduce((sum, sw) => sum + (sw.weight || 0), 0);
    
    stakeWeights.forEach(sw => {
      const stake = stakes.find(s => s.value === sw.stake);
      if (stake && (sw.weight || 0) > 0) {
        const handsForStake = sw.volumeType === 'hands' 
          ? Math.min(sw.weight || 0, numHands)
          : Math.round(((sw.weight || 0) / totalWeight) * numHands);
        
        for (let i = 0; i < Math.min(handsForStake, 1000); i++) {
          stakePool.push({
            bb: stake.bb,
            winrate: sw.customWinrate || 0,
            stdDev: sw.customStdDev || 0
          });
        }
      }
    });
    
    if (stakePool.length === 0) {
      stakePool.push({
        bb: 0.25,
        winrate: parameters.winrate || 0,
        stdDev: parameters.stdDev || 0
      });
    }
    
    const samples = [];
    
    for (let sample = 0; sample < numSamples; sample++) {
      const sampleData = [];
      let cumulativeDollars = 0;
      
      for (let hand = 1; hand <= numHands; hand++) {
        const stakeInfo = stakePool[Math.floor(Math.random() * stakePool.length)];
        const handResultBB = normalRandom() * ((stakeInfo.stdDev || 0) / Math.sqrt(100)) + ((stakeInfo.winrate || 0) / 100);
        const handResultDollars = handResultBB * stakeInfo.bb;
        cumulativeDollars += handResultDollars;
        
        if (hand % 1000 === 0 || hand === numHands) {
          sampleData.push({ x: hand, y: cumulativeDollars });
        }
      }
      
      samples.push({ data: sampleData, finalEV: cumulativeDollars });
    }
    
    const finalEVs = samples.map(s => s.finalEV);
    finalEVs.sort((a, b) => a - b);
    
    return {
      samples,
      finalEVs,
      bestRun: Math.max(...finalEVs),
      worstRun: Math.min(...finalEVs),
      avgEV: finalEVs.reduce((a, b) => a + b, 0) / finalEVs.length,
      conf95Lower: finalEVs[Math.floor(0.025 * numSamples)] || 0,
      conf95Upper: finalEVs[Math.floor(0.975 * numSamples)] || 0
    };
  };

  const runSimulation = () => {
    // Memory guard at the very beginning
    if (isOverLimit) {
      alert('Limit exceeded: samples × hands must be ≤ 100,000,000. Please reduce your inputs.');
      return;
    }

    const { numHands, numSamples, stakeWeights } = parameters;
    
    if (isNaN(numHands) || numHands <= 0 || isNaN(numSamples) || numSamples <= 0) {
      alert('Please enter valid numeric values.');
      return;
    }
    
    setIsCalculating(true);
    setTimeout(() => {
      const simResults = monteCarloSimulation(numHands, numSamples, stakeWeights);
      setResults(simResults);
      setIsCalculating(false);
    }, 100);
  };

  const prepareChartData = () => {
    if (!results) return [];
    const { numHands } = parameters;
    const maxHands = Math.floor(numHands / 1000) * 1000;
    const weightedBB = getWeightedAverageBB();
    const weightedWinrate = getWeightedAverageWinrate();
    const combinedData = [];
    
    for (let hand = 1000; hand <= maxHands; hand += 1000) {
      const dataPoint = { x: hand };
      dataPoint.theoreticalEV = (weightedWinrate * hand / 100) * weightedBB;
      const progress = hand / numHands;
      dataPoint.conf95Upper = results.conf95Upper * progress;
      dataPoint.conf95Lower = results.conf95Lower * progress;
      
      results.samples.forEach((sample, sampleIndex) => {
        const samplePoint = sample.data.find(point => point.x === hand);
        if (samplePoint) dataPoint[`sample${sampleIndex}`] = samplePoint.y;
      });
      combinedData.push(dataPoint);
    }
    return combinedData;
  };

  const formatNumber = (num, inDollars = false) => {
    if (num === Infinity || isNaN(num)) return '∞';
    if (inDollars) {
      return '$' + Math.round(num).toLocaleString();
    }
    const weightedBB = getWeightedAverageBB();
    return Math.round(num / weightedBB).toLocaleString();
  };

  const getStakeMixLabel = () => {
    if (parameters.stakeWeights.length === 1) {
      const stake = stakes.find(s => s.value === parameters.stakeWeights[0].stake);
      return stake ? stake.label : '25NL';
    }
    return 'Mixed';
  };

  const getPrimaryStake = () => {
    const maxWeight = Math.max(...parameters.stakeWeights.map(sw => sw.weight || 0));
    const primary = parameters.stakeWeights.find(sw => (sw.weight || 0) === maxWeight);
    return stakes.find(s => s.value === (primary?.stake || '25nl')) || stakes[2];
  };

  const eyeOffset = getEyeOffset();

  // Cartoon Nacho SVG Component
  const CartoonNacho = () => (
    <svg ref={nachoRef} width="90" height="90" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 4px 12px rgba(255, 179, 71, 0.4))' }}>
      <path d="M50 8 L88 85 Q90 92 82 92 L18 92 Q10 92 12 85 Z" fill="#FFB347" stroke="#E09A30" strokeWidth="2" />
      <path d="M25 70 Q20 75 22 82 Q24 88 28 85 Q30 80 28 75 Z" fill="#FFD54F" opacity="0.9" />
      <path d="M72 65 Q78 72 76 80 Q74 86 70 82 Q68 76 70 70 Z" fill="#FFD54F" opacity="0.9" />
      <path d="M48 75 Q45 82 48 88 Q52 92 55 86 Q56 80 52 76 Z" fill="#FFD54F" opacity="0.9" />
      <ellipse cx="50" cy="50" rx="22" ry="18" fill="#FFB347" />
      <ellipse cx="40" cy="48" rx="8" ry="9" fill="white" />
      <ellipse cx="60" cy="48" rx="8" ry="9" fill="white" />
      <circle cx={40 + eyeOffset.x} cy={48 + eyeOffset.y} r="4" fill="#1a1a1a" style={{ transition: 'cx 0.1s ease-out, cy 0.1s ease-out' }} />
      <circle cx={60 + eyeOffset.x} cy={48 + eyeOffset.y} r="4" fill="#1a1a1a" style={{ transition: 'cx 0.1s ease-out, cy 0.1s ease-out' }} />
      <circle cx={38 + eyeOffset.x * 0.5} cy={46 + eyeOffset.y * 0.5} r="1.5" fill="white" opacity="0.8" />
      <circle cx={58 + eyeOffset.x * 0.5} cy={46 + eyeOffset.y * 0.5} r="1.5" fill="white" opacity="0.8" />
      <path d="M38 62 Q50 72 62 62" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
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
      <path d="M10 2 L18 17 L2 17 Z" fill="#FFB347" opacity="0.8" />
    </svg>
  );

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
        
        /* Mobile First - Header Layout */
        .header-layout {
          display: flex;
          flex-direction: column !important;
          align-items: center;
          text-align: center;
          gap: 20px;
        }
        
        .header-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }
        
        .header-text {
          flex: 1;
        }
        
        /* Mobile First - Parameters and Stake panels */
        .params-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .params-basic {
          flex: 1;
        }
        
        .params-advanced {
          flex: 1;
        }
        
        /* Mobile First - Results Grid */
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        
        /* Mobile First - How to Use Grid */
        .howto-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }
        
        /* Mobile First - Bankroll Grid */
        .bankroll-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        
        /* Stake Inputs Grid - Mobile First (stacked) */
        .stake-inputs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          align-items: end;
        }
        
        .stake-input-group {
          display: flex;
          flex-direction: column;
          min-width: 0;
          position: relative;
        }
        
        .stake-input-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          gap: 4px;
          min-height: 20px;
        }
        
        .stake-input-label {
          color: rgba(255,255,255,0.5);
          font-size: 11px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .stake-input-field {
          width: 100%;
          padding: 8px 10px;
          border-radius: 6px;
          background: rgba(0,0,0,0.4);
          color: #ffffff;
          border: 1px solid rgba(255,255,255,0.1);
          outline: none;
          font-size: 13px;
          box-sizing: border-box;
        }
        
        .stake-input-field:focus {
          border-color: #FFB347 !important;
          box-shadow: 0 0 0 3px rgba(255, 179, 71, 0.15);
        }
        
        @media (min-width: 768px) {
          .header-layout {
            flex-direction: row !important;
            text-align: left;
            justify-content: space-between;
          }
          .header-buttons {
            flex-direction: row;
            width: auto;
          }
          .header-text {
            text-align: left;
          }
          .params-container {
            flex-direction: row;
          }
          .params-basic {
            flex: 0 0 320px;
            max-width: 320px;
          }
          .params-advanced {
            flex: 1 1 auto;
            min-width: 0;
          }
          .stake-inputs-grid {
            grid-template-columns: 90px 1fr 1fr 1fr;
            gap: 16px;
            align-items: end;
          }
        }
        
        @media (min-width: 1024px) {
          .params-basic {
            flex: 0 0 340px;
            max-width: 340px;
          }
          .stake-inputs-grid {
            grid-template-columns: 100px 1fr 1fr 1fr;
            gap: 20px;
          }
        }
        
        /* Spark Border Container */
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
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
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
        
        .collapsible-content {
          overflow: hidden;
          transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-flex;
          background: rgba(0,0,0,0.4);
          border-radius: 4px;
          padding: 1px;
          border: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        
        .toggle-option {
          padding: 3px 6px;
          font-size: 10px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.2s ease;
          color: rgba(255,255,255,0.5);
          white-space: nowrap;
        }
        
        .toggle-option.active {
          background: rgba(255, 179, 71, 0.2);
          color: #FFB347;
        }
      `}</style>

      <div style={{position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '20px'}}>
        <NachosPokerNavBar />
        
        {/* Header Banner */}
        <div 
          className="card-hover spark-border header-layout"
          style={{
            marginBottom: '30px',
            padding: '28px 32px',
            animation: 'fadeInUp 0.6s ease-out'
          }}
        >
          <div style={{ flexShrink: 0, animation: 'bounce 2s ease-in-out infinite' }}>
            <CartoonNacho />
          </div>
          
          <div className="header-text">
            <div style={{fontSize: '12px', color: '#FFB347', fontWeight: '600', marginBottom: '6px', letterSpacing: '0.1em', textTransform: 'uppercase'}}>
              Crafted by FreeNachos
            </div>
            <h2 style={{fontSize: '22px', fontWeight: '700', color: '#ffffff', marginBottom: '8px', lineHeight: 1.2}}>
              Crush the variance, not your bankroll.
            </h2>
            <p style={{fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '0', lineHeight: 1.5, maxWidth: '400px'}}>
              Level up your game with elite coaching or join the fastest-growing CFP in poker.
            </p>
          </div>
          
          <div className="header-buttons" style={{flexShrink: 0}}>
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
                justifyContent: 'center',
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
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Private Coaching <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Main Simulator Card */}
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
            Poker EV Simulator
          </h1>
          <p style={{textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '30px'}}>
            Understand your variance with multi-stake weighting
          </p>
          
          <div className="params-container" style={{marginBottom: '30px'}}>
            {/* Parameters Panel */}
            <div className="glass-card params-basic" style={{
              padding: '28px', 
              borderRadius: '12px',
              animation: 'fadeIn 0.4s ease-out 0.2s both'
            }}>
              <h3 style={{color: '#FFB347', marginBottom: '16px', textAlign: 'center', fontSize: '16px', fontWeight: '600'}}>Basic Parameters</h3>
              
              <div style={{
                background: 'rgba(255, 179, 71, 0.1)',
                border: '1px solid rgba(255, 179, 71, 0.2)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.5
              }}>
                <strong style={{color: '#FFB347'}}>Performance Note:</strong> For stability, samples × hands must be ≤ 100M.
                <br />
                <span style={{color: 'rgba(255,255,255,0.4)'}}>Current: {samplehands.toLocaleString()} / 100,000,000</span>
              </div>
              
              <div style={{marginBottom: '16px'}}>
                <label style={{color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500'}}>Default Win rate (BB/100)</label>
                <input 
                  type="number" 
                  value={parameters.winrate} 
                  onChange={(e) => setParameters({...parameters, winrate: parseFloat(e.target.value) || 0})} 
                  className="input-focus"
                  style={{width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontSize: '14px', boxSizing: 'border-box'}} 
                  step="0.1" 
                />
              </div>
              <div style={{marginBottom: '16px'}}>
                <label style={{color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500'}}>Default Std Dev (BB/100)</label>
                <input 
                  type="number" 
                  value={parameters.stdDev} 
                  onChange={(e) => setParameters({...parameters, stdDev: parseFloat(e.target.value) || 0})} 
                  className="input-focus"
                  style={{width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontSize: '14px', boxSizing: 'border-box'}} 
                  step="1" 
                />
              </div>
              <div style={{marginBottom: '16px'}}>
                <label style={{color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500'}}>Number of hands (max {MAX_HANDS.toLocaleString()})</label>
                <input 
                  type="number" 
                  value={parameters.numHands} 
                  onChange={(e) => handleHandsChange(e.target.value)} 
                  className="input-focus"
                  style={{width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontSize: '14px', boxSizing: 'border-box'}} 
                  step="1000" 
                />
              </div>
              <div>
                <label style={{color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500'}}>Number of samples (max {MAX_SAMPLES})</label>
                <input 
                  type="number" 
                  value={parameters.numSamples} 
                  onChange={(e) => handleSamplesChange(e.target.value)} 
                  className="input-focus"
                  style={{width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontSize: '14px', boxSizing: 'border-box'}} 
                  step="1" 
                />
              </div>
            </div>

            {/* Advanced Stake Settings Panel */}
            <div className="glass-card params-advanced" style={{
              padding: '28px', 
              borderRadius: '12px',
              animation: 'fadeIn 0.4s ease-out 0.3s both'
            }}>
              {/* Collapsible Header */}
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  marginBottom: advancedOpen ? '16px' : '0'
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <Settings size={18} color="#FFB347" />
                  <h3 style={{color: '#FFB347', fontSize: '16px', fontWeight: '600', margin: 0}}>Advanced Stake Settings</h3>
                </div>
                {advancedOpen ? <ChevronUp size={20} color="#FFB347" /> : <ChevronDown size={20} color="#FFB347" />}
              </button>
              
              {/* Collapsible Content */}
              <div 
                className="collapsible-content"
                style={{
                  maxHeight: advancedOpen ? '1000px' : '0',
                  opacity: advancedOpen ? 1 : 0
                }}
              >
                <div style={{marginBottom: '16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: 1.5}}>
                  Configure individual stakes with custom win rates and standard deviations.
                </div>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  {parameters.stakeWeights.map((sw, index) => (
                    <div key={index} style={{
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '10px',
                      padding: '16px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                        <span style={{color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600'}}>Stake #{index + 1}</span>
                        {parameters.stakeWeights.length > 1 && (
                          <button 
                            onClick={() => removeStake(index)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px'
                            }}
                          >
                            <X size={12} /> Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="stake-inputs-grid">
                        {/* Stake Dropdown */}
                        <div className="stake-input-group">
                          <div className="stake-input-header">
                            <span className="stake-input-label">Stake</span>
                          </div>
                          <select
                            value={sw.stake}
                            onChange={(e) => updateStakeWeight(index, 'stake', e.target.value)}
                            className="stake-input-field input-focus"
                            style={{cursor: 'pointer'}}
                          >
                            {stakes.map(stake => (
                              <option key={stake.value} value={stake.value} style={{background: '#1a1a1a'}}>
                                {stake.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Volume - Header with Toggle, Input Below */}
                        <div className="stake-input-group">
                          <div className="stake-input-header">
                            <span className="stake-input-label">Volume</span>
                            <div className="toggle-switch">
                              <span 
                                className={`toggle-option ${sw.volumeType === 'percentage' ? 'active' : ''}`}
                                onClick={() => updateStakeWeight(index, 'volumeType', 'percentage')}
                              >%</span>
                              <span 
                                className={`toggle-option ${sw.volumeType === 'hands' ? 'active' : ''}`}
                                onClick={() => updateStakeWeight(index, 'volumeType', 'hands')}
                              >Hands</span>
                            </div>
                          </div>
                          <input
                            type="number"
                            value={sw.weight}
                            onChange={(e) => updateStakeWeight(index, 'weight', parseInt(e.target.value) || 0)}
                            className="stake-input-field input-focus"
                            min="0"
                          />
                        </div>
                        
                        {/* Custom Win Rate */}
                        <div className="stake-input-group">
                          <div className="stake-input-header">
                            <span className="stake-input-label">Win Rate</span>
                            <span style={{fontSize: '9px', color: 'rgba(255,255,255,0.3)'}}>BB/100</span>
                          </div>
                          <input
                            type="number"
                            value={sw.customWinrate}
                            onChange={(e) => updateStakeWeight(index, 'customWinrate', parseFloat(e.target.value) || 0)}
                            className="stake-input-field input-focus"
                            step="0.1"
                          />
                        </div>
                        
                        {/* Custom Std Dev */}
                        <div className="stake-input-group">
                          <div className="stake-input-header">
                            <span className="stake-input-label">Std Dev</span>
                            <span style={{fontSize: '9px', color: 'rgba(255,255,255,0.3)'}}>BB/100</span>
                          </div>
                          <input
                            type="number"
                            value={sw.customStdDev}
                            onChange={(e) => updateStakeWeight(index, 'customStdDev', parseFloat(e.target.value) || 0)}
                            className="stake-input-field input-focus"
                            step="1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={addStake}
                  className="btn-hover"
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    background: 'rgba(255, 179, 71, 0.1)',
                    border: '1px dashed rgba(255, 179, 71, 0.3)',
                    color: '#FFB347',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  <Plus size={16} /> Add Another Stake
                </button>
              </div>
              
              {/* Summary Stats (always visible) */}
              <div style={{
                marginTop: advancedOpen ? '20px' : '16px',
                padding: '14px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px'
              }}>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center'}}>
                  <div>
                    <div style={{fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Avg BB</div>
                    <div style={{fontSize: '16px', fontWeight: '700', color: '#FFB347'}}>${getWeightedAverageBB().toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Avg WR</div>
                    <div style={{fontSize: '16px', fontWeight: '700', color: '#22c55e'}}>{getWeightedAverageWinrate().toFixed(1)}</div>
                  </div>
                  <div>
                    <div style={{fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Avg SD</div>
                    <div style={{fontSize: '16px', fontWeight: '700', color: '#ffffff'}}>{getWeightedAverageStdDev().toFixed(0)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={runSimulation} 
            disabled={isCalculating || isOverLimit}
            className="btn-hover"
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '10px',
              border: 'none',
              background: isOverLimit ? 'rgba(239, 68, 68, 0.3)' : 'linear-gradient(135deg, #FFB347 0%, #FFCC70 100%)',
              color: isOverLimit ? '#ef4444' : '#0a0a0a',
              fontSize: '16px',
              fontWeight: '700',
              cursor: isCalculating || isOverLimit ? 'not-allowed' : 'pointer',
              boxShadow: isOverLimit ? 'none' : '0 4px 20px rgba(255, 179, 71, 0.3)',
              opacity: isCalculating ? 0.7 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {isCalculating ? 'Calculating...' : isOverLimit ? `Limit Exceeded (${samplehands.toLocaleString()} > 100M)` : 'Run Simulation'}
          </button>
        </div>

        {/* Nacho Bankroll Analysis Section */}
        <div 
          className="card-hover glass-card"
          style={{
            borderRadius: '16px', 
            padding: '40px', 
            marginBottom: '30px',
            animation: 'fadeInUp 0.6s ease-out 0.15s both'
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px'}}>
            <span style={{fontSize: '28px'}}>🌮</span>
            <h2 style={{fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: 0}}>
              Nacho Bankroll Analysis
            </h2>
          </div>
          <p style={{textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '24px'}}>
            Minimum bankroll requirements based on Risk of Ruin • Primary stake: {getPrimaryStake().label}
          </p>
          
          <div className="bankroll-grid">
            {bankrollProfiles.map((profile, index) => {
              const requirement = calculateBankrollRequirement(profile.ror);
              return (
                <div 
                  key={index}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: profile.ror === 0.05 ? '1px solid rgba(255, 179, 71, 0.3)' : '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <div style={{fontSize: '36px', marginBottom: '8px'}}>{profile.emoji}</div>
                  <div style={{fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '4px'}}>
                    {profile.name}
                  </div>
                  <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px'}}>
                    {profile.description} • {(profile.ror * 100).toFixed(1)}% RoR
                  </div>
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{fontSize: '20px', fontWeight: '700', color: '#FFB347', marginBottom: '4px'}}>
                      {requirement.dollars === Infinity ? '∞' : `$${requirement.dollars.toLocaleString()}`}
                    </div>
                    <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.5)'}}>
                      {requirement.bb === Infinity ? '∞' : `${requirement.bb.toLocaleString()} BB`}
                    </div>
                  </div>
                  {profile.ror === 0.05 && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '10px',
                      color: '#FFB347',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      ★ Recommended
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div style={{
            marginTop: '20px',
            padding: '14px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0, lineHeight: 1.6}}>
              <strong style={{color: '#FFB347'}}>Formula:</strong> B = (σ² / 2WR) × ln(1/RoR) where σ = std dev per hand, WR = win rate per hand
            </p>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div 
            className="card-hover glass-card"
            style={{
              borderRadius: '16px', 
              padding: '40px', 
              marginBottom: '30px',
              animation: 'fadeInUp 0.6s ease-out'
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px'}}>
              <h2 style={{fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: 0}}>
                Simulation Results
              </h2>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <span style={{color: 'rgba(255,255,255,0.5)', fontSize: '13px'}}>Display:</span>
                <button
                  onClick={() => setDisplayInDollars(!displayInDollars)}
                  className="btn-hover"
                  style={{
                    background: displayInDollars ? 'rgba(255, 179, 71, 0.2)' : 'rgba(255,255,255,0.1)',
                    border: `1px solid ${displayInDollars ? 'rgba(255, 179, 71, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                    color: displayInDollars ? '#FFB347' : 'rgba(255,255,255,0.6)',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  $ Dollars
                </button>
                <button
                  onClick={() => setDisplayInDollars(!displayInDollars)}
                  className="btn-hover"
                  style={{
                    background: !displayInDollars ? 'rgba(255, 179, 71, 0.2)' : 'rgba(255,255,255,0.1)',
                    border: `1px solid ${!displayInDollars ? 'rgba(255, 179, 71, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                    color: !displayInDollars ? '#FFB347' : 'rgba(255,255,255,0.6)',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  BB ({getStakeMixLabel()})
                </button>
              </div>
            </div>
            
            <div className="results-grid" style={{marginBottom: '28px'}}>
              <div className="glass-card" style={{padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Theoretical EV</div>
                <div style={{fontSize: '24px', fontWeight: '700', color: '#ffffff'}}>
                  {formatNumber((getWeightedAverageWinrate() * parameters.numHands / 100) * getWeightedAverageBB(), displayInDollars)}
                </div>
                <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px'}}>
                  {displayInDollars ? `${Math.round((getWeightedAverageWinrate() * parameters.numHands / 100)).toLocaleString()} BB` : `$${Math.round((getWeightedAverageWinrate() * parameters.numHands / 100) * getWeightedAverageBB()).toLocaleString()}`}
                </div>
              </div>
              <div className="glass-card" style={{padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Best Run</div>
                <div style={{fontSize: '24px', fontWeight: '700', color: '#22c55e'}}>
                  {formatNumber(results.bestRun, displayInDollars)}
                </div>
                <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px'}}>
                  {displayInDollars ? `${Math.round(results.bestRun / getWeightedAverageBB()).toLocaleString()} BB` : `$${Math.round(results.bestRun).toLocaleString()}`}
                </div>
              </div>
              <div className="glass-card" style={{padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Worst Run</div>
                <div style={{fontSize: '24px', fontWeight: '700', color: '#ef4444'}}>
                  {formatNumber(results.worstRun, displayInDollars)}
                </div>
                <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px'}}>
                  {displayInDollars ? `${Math.round(results.worstRun / getWeightedAverageBB()).toLocaleString()} BB` : `$${Math.round(results.worstRun).toLocaleString()}`}
                </div>
              </div>
              <div className="glass-card" style={{padding: '20px', borderRadius: '10px', textAlign: 'center'}}>
                <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>95% CI Range</div>
                <div style={{fontSize: '18px', fontWeight: '700', color: '#22c55e'}}>
                  {formatNumber(results.conf95Lower, displayInDollars)} to {formatNumber(results.conf95Upper, displayInDollars)}
                </div>
                <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px'}}>
                  Most outcomes fall here
                </div>
              </div>
            </div>
            
            {/* Chart */}
            <div style={{background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '24px'}}>
              <div style={{height: '400px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={prepareChartData()} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    onMouseMove={(e) => {
                      if (e && e.activePayload) {
                        const payload = e.activePayload;
                        for (let i = 0; i < results.samples.length; i++) {
                          if (payload.find(p => p.dataKey === `sample${i}`)) {
                            setHoveredSample(i);
                            return;
                          }
                        }
                      }
                    }}
                    onMouseLeave={() => setHoveredSample(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="x" 
                      stroke="rgba(255,255,255,0.3)" 
                      tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 11}}
                      tickFormatter={(val) => `${(val/1000)}k`}
                      label={{value: 'Hands', position: 'insideBottomRight', offset: -10, fill: 'rgba(255,255,255,0.4)', fontSize: 11}}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)" 
                      tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 11}}
                      tickFormatter={(val) => displayInDollars ? `$${(val/1000).toFixed(0)}k` : `${Math.round(val / getWeightedAverageBB()).toLocaleString()}`}
                      label={{value: displayInDollars ? 'Profit ($)' : 'Profit (BB)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.4)', fontSize: 11}}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: 'rgba(20, 20, 20, 0.95)',
                        border: '1px solid rgba(255, 179, 71, 0.3)',
                        borderRadius: '10px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(10px)'
                      }}
                      labelStyle={{color: '#FFB347', fontWeight: '600', marginBottom: '8px'}}
                      labelFormatter={(value) => `Hand ${value.toLocaleString()}`}
                      formatter={(value, name) => {
                        if (name === 'theoreticalEV') return [formatNumber(value, displayInDollars), 'Theoretical'];
                        if (name === 'conf95Upper') return [formatNumber(value, displayInDollars), '95% Upper'];
                        if (name === 'conf95Lower') return [formatNumber(value, displayInDollars), '95% Lower'];
                        return [formatNumber(value, displayInDollars), `Sample ${name.replace('sample', '')}`];
                      }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const theoreticalEV = payload.find(p => p.dataKey === 'theoreticalEV');
                        const upper = payload.find(p => p.dataKey === 'conf95Upper');
                        const lower = payload.find(p => p.dataKey === 'conf95Lower');
                        const samplePayloads = payload.filter(p => p.dataKey.startsWith('sample'));
                        const hoveredSamplePayload = hoveredSample !== null ? samplePayloads.find(p => p.dataKey === `sample${hoveredSample}`) : null;
                        
                        return (
                          <div style={{
                            background: 'rgba(20, 20, 20, 0.95)',
                            border: '1px solid rgba(255, 179, 71, 0.3)',
                            borderRadius: '10px',
                            padding: '14px 18px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                          }}>
                            <div style={{color: '#FFB347', fontWeight: '600', marginBottom: '10px', fontSize: '13px'}}>
                              Hand {label.toLocaleString()}
                            </div>
                            {[
                              theoreticalEV && { name: 'Theoretical EV', value: theoreticalEV.value, color: 'rgba(255,255,255,0.6)' },
                              upper && { name: '95% Upper', value: upper.value, color: '#22c55e' },
                              lower && { name: '95% Lower', value: lower.value, color: '#22c55e' },
                              hoveredSamplePayload && { name: `Sample ${hoveredSample}`, value: hoveredSamplePayload.value, color: '#FFB347' }
                            ].filter(Boolean).map((item, i) => (
                              <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '4px'}}>
                                <span style={{color: item.color, fontSize: '12px'}}>{item.name}</span>
                                <span style={{color: '#ffffff', fontWeight: '600', fontSize: '12px'}}>
                                  {formatNumber(item.value, displayInDollars)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    {results.samples.map((sample, index) => {
                      const isHovered = hoveredSample === index;
                      const isBest = sample.finalEV === results.bestRun;
                      const isWorst = sample.finalEV === results.worstRun;
                      
                      let strokeColor = "rgba(255, 255, 255, 0.12)";
                      let strokeWidth = 1;
                      
                      if (isHovered) {
                        strokeColor = "#FFB347";
                        strokeWidth = 4;
                      } else if (isBest) {
                        strokeColor = "#22c55e";
                        strokeWidth = 2;
                      } else if (isWorst) {
                        strokeColor = "#ef4444";
                        strokeWidth = 2;
                      }
                      
                      return (
                        <Line 
                          key={index} 
                          type="monotone" 
                          dataKey={`sample${index}`} 
                          stroke={strokeColor} 
                          strokeWidth={strokeWidth} 
                          dot={false} 
                          legendType="none"
                          onMouseEnter={() => setHoveredSample(index)}
                          activeDot={false}
                        />
                      );
                    })}
                    <Line type="monotone" dataKey="theoreticalEV" stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Theoretical" />
                    <Line type="monotone" dataKey="conf95Upper" stroke="#22c55e" strokeWidth={2} dot={false} name="95% Upper" />
                    <Line type="monotone" dataKey="conf95Lower" stroke="#22c55e" strokeWidth={2} dot={false} name="95% Lower" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{textAlign: 'center', marginTop: '14px', color: 'rgba(255,255,255,0.4)', fontSize: '13px'}}>
                Hover over any sample line to highlight it • Per-stake variance properly applied
              </div>
              
              {/* Legend */}
              <div style={{marginTop: '18px', padding: '14px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px'}}>
                <div style={{display: 'flex', justifyContent: 'center', gap: '28px', flexWrap: 'wrap', alignItems: 'center'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{width: '24px', height: '2px', background: 'rgba(255,255,255,0.4)', borderTop: '2px dashed rgba(255,255,255,0.4)'}}></div>
                    <span style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px'}}>Theoretical EV</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{width: '24px', height: '2px', background: '#22c55e', borderRadius: '2px'}}></div>
                    <span style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px'}}>95% Confidence</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{width: '24px', height: '2px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px'}}></div>
                    <span style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px'}}>All Samples ({results.samples.length})</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{width: '24px', height: '3px', background: '#FFB347', borderRadius: '2px'}}></div>
                    <span style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px'}}>Hovered Sample</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How to Use Section */}
        <div 
          className="glass-card"
          style={{
            borderRadius: '16px', 
            padding: '40px',
            animation: 'fadeInUp 0.6s ease-out 0.2s both'
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '28px'}}>
            <HelpCircle size={24} color="#FFB347" />
            <h2 style={{fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: 0}}>
              How to Use & Read Results
            </h2>
          </div>

          <div className="howto-grid">
            <div style={{
              background: 'rgba(255, 179, 71, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 179, 71, 0.2)'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px'}}>
                <Target size={20} color="#FFB347" />
                <h3 style={{color: '#FFB347', fontSize: '14px', fontWeight: '600', margin: 0}}>Input Parameters</h3>
              </div>
              <ul style={{color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.9, margin: 0, paddingLeft: '16px'}}>
                <li><strong style={{color: '#ffffff'}}>Win Rate:</strong> Your expected BB/100</li>
                <li><strong style={{color: '#ffffff'}}>Std Dev:</strong> Variance (typically 70-120)</li>
                <li><strong style={{color: '#ffffff'}}>Hands:</strong> Total hands to simulate</li>
                <li><strong style={{color: '#ffffff'}}>Samples:</strong> Number of runs</li>
                <li><strong style={{color: '#ffffff'}}>Advanced:</strong> Per-stake custom settings</li>
              </ul>
            </div>

            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px'}}>
                <TrendingUp size={20} color="#22c55e" />
                <h3 style={{color: '#22c55e', fontSize: '14px', fontWeight: '600', margin: 0}}>Reading the Chart</h3>
              </div>
              <ul style={{color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.9, margin: 0, paddingLeft: '16px'}}>
                <li><strong style={{color: '#ffffff'}}>Gray dashed:</strong> Theoretical EV line</li>
                <li><strong style={{color: '#ffffff'}}>Green lines:</strong> 95% confidence bounds</li>
                <li><strong style={{color: '#ffffff'}}>Faint lines:</strong> Individual sample runs</li>
                <li><strong style={{color: '#ffffff'}}>Best/Worst:</strong> Green/red highlights</li>
                <li><strong style={{color: '#ffffff'}}>Hover:</strong> Highlight any line</li>
              </ul>
            </div>

            <div className="glass-card" style={{
              padding: '24px',
              borderRadius: '12px'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px'}}>
                <BarChart3 size={20} color="rgba(255,255,255,0.8)" />
                <h3 style={{color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600', margin: 0}}>Key Insights</h3>
              </div>
              <ul style={{color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.9, margin: 0, paddingLeft: '16px'}}>
                <li><strong style={{color: '#ffffff'}}>Wide spread:</strong> High variance expected</li>
                <li><strong style={{color: '#ffffff'}}>Tight spread:</strong> More consistent results</li>
                <li><strong style={{color: '#ffffff'}}>Below EV:</strong> Normal short-term</li>
                <li><strong style={{color: '#ffffff'}}>95% CI:</strong> Most runs fall within</li>
                <li><strong style={{color: '#ffffff'}}>Long-term:</strong> Converges to true EV</li>
              </ul>
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
              <strong style={{color: '#FFB347'}}>Pro Tip:</strong> Run multiple simulations with different sample sizes to truly understand your variance. 
              Even winning players can experience significant downswings — this tool helps you prepare mentally and financially.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokerEVSimulation;
