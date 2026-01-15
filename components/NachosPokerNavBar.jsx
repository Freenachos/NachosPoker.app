'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calculator, LineChart, Users, DollarSign, FileText, Zap } from 'lucide-react';

const NachosPokerNavBar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/variance', label: 'Variance', icon: Calculator },
    { href: '/winrate', label: 'Win Rate', icon: LineChart },
    { href: '/seat', label: 'Seat Selection', icon: Users },
    { href: '/profits', label: 'Profits', icon: DollarSign },
    { href: '/bbj', label: 'BBJ', icon: Zap },
    { href: '/articles', label: 'Articles', icon: FileText },
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <style>{`
        .nachospoker-navbar {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .nachospoker-navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .nachospoker-navbar-logo {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .nachospoker-navbar-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .nachospoker-navbar-brand-text {
          display: flex;
          flex-direction: column;
        }
        .nachospoker-navbar-brand-name {
          color: white;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.1;
        }
        .nachospoker-navbar-brand-suffix {
          color: #FFB347;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .nachospoker-navbar-links {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .nachospoker-nav-item {
          padding: 8px 12px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          font-weight: 500;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          text-decoration: none;
        }
        .nachospoker-nav-item:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        .nachospoker-nav-item.active {
          color: #FFB347;
          background: rgba(255, 179, 71, 0.15);
        }
        @media (max-width: 900px) {
          .nachospoker-nav-item {
            padding: 8px 10px;
            font-size: 11px;
          }
          .nachospoker-nav-item svg {
            display: none;
          }
        }
        @media (max-width: 600px) {
          .nachospoker-navbar {
            padding: 10px 12px;
          }
          .nachospoker-navbar-links {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
      
      <nav className="nachospoker-navbar">
        {/* Logo & Brand */}
        <div className="nachospoker-navbar-brand">
          <div className="nachospoker-navbar-logo">
            <img src="/logo.png" alt="NachosPoker" />
          </div>
          <div className="nachospoker-navbar-brand-text">
            <span className="nachospoker-navbar-brand-name">NachosPoker</span>
            <span className="nachospoker-navbar-brand-suffix">.App</span>
          </div>
        </div>
        
        {/* Navigation Links */}
        <div className="nachospoker-navbar-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nachospoker-nav-item ${isActive(item.href) ? 'active' : ''}`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default NachosPokerNavBar;
