import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// TypeScript interfaces for API data
interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

interface PortfolioData {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: Array<{
    symbol: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    totalValue: number;
    unrealizedPL: number;
  }>;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

// API service functions
const API_BASE_URL = 'http://localhost:8080/api';

class ApiService {
  private static async fetchWithFallback<T>(
    endpoint: string,
    fallbackData: T
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<T> = await response.json();
      return result.data;
    } catch (error) {
      console.warn(`Backend unavailable for ${endpoint}, using fallback data:`, error);
      return fallbackData;
    }
  }

  static async getStockData(): Promise<StockData[]> {
    const fallbackData: StockData[] = [
      { symbol: 'AAPL', price: 175.43, change: 2.34, changePercent: 1.35, volume: 45234567 },
      { symbol: 'GOOGL', price: 2734.56, change: -15.67, changePercent: -0.57, volume: 1234567 },
      { symbol: 'MSFT', price: 334.78, change: 5.23, changePercent: 1.59, volume: 23456789 },
      { symbol: 'TSLA', price: 248.90, change: -8.45, changePercent: -3.28, volume: 34567890 },
      { symbol: 'NVDA', price: 456.12, change: 12.34, changePercent: 2.78, volume: 15678901 }
    ];

    return this.fetchWithFallback('/stocks/market-data', fallbackData);
  }

  static async getPortfolioData(): Promise<PortfolioData> {
    const fallbackData: PortfolioData = {
      totalValue: 125750.50,
      dayChange: 2450.75,
      dayChangePercent: 1.99,
      holdings: [
        {
          symbol: 'AAPL',
          quantity: 100,
          averagePrice: 168.50,
          currentPrice: 175.43,
          totalValue: 17543.00,
          unrealizedPL: 693.00
        },
        {
          symbol: 'GOOGL',
          quantity: 25,
          averagePrice: 2800.00,
          currentPrice: 2734.56,
          totalValue: 68364.00,
          unrealizedPL: -1636.00
        },
        {
          symbol: 'MSFT',
          quantity: 75,
          averagePrice: 320.00,
          currentPrice: 334.78,
          totalValue: 25108.50,
          unrealizedPL: 1108.50
        }
      ]
    };

    return this.fetchWithFallback('/portfolio/summary', fallbackData);
  }
}

// 3D Particle Component
const ParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
    }> = [];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        color: `rgba(0, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.8)`,
        life: Math.random()
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 5, 16, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life += 0.005;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // Draw connections
        particles.forEach(other => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
};

// 3D Holographic Card Component
const HolographicCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;

      card.style.transform = `
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg)
        translateZ(20px)
      `;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div ref={cardRef} className={`holographic-card ${className}`}>
      {children}
    </div>
  );
};

const App: React.FC = () => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'fallback' | 'checking'>('checking');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Check backend connectivity
  const checkBackendConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 5000
      } as RequestInit);
      return response.ok;
    } catch {
      return false;
    }
  };

  // Load data from backend or fallback
  const loadData = async () => {
    setLoading(true);

    const isConnected = await checkBackendConnection();
    setBackendStatus(isConnected ? 'connected' : 'fallback');

    try {
      const [stocks, portfolio] = await Promise.all([
        ApiService.getStockData(),
        ApiService.getPortfolioData()
      ]);

      setStockData(stocks);
      setPortfolioData(portfolio);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    loadData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="app cosmic-background">
        <ParticleField />
        <div className="loading-container">
          <div className="holographic-loader"></div>
          <h2 className="neon-text">Initializing Trading Matrix...</h2>
          <p className="subtitle-text">Connecting to financial data streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app cosmic-background">
      <ParticleField />

      {/* Neon Chinese Sign */}
      <div className="neon-chinese-sign">至福</div>

      {/* Header */}
      <header className="cosmic-header">
        <h1 className="main-title">BLISS TRADING MATRIX</h1>
        <div className="status-bar">
          <div className={`connection-status ${backendStatus}`}>
            <span className="status-dot"></span>
            {backendStatus === 'connected' ? 'LIVE MARKET DATA' : 'SIMULATION MODE'}
          </div>
          <div className="last-updated">
            LAST SYNC: {lastUpdated.toLocaleTimeString()}
          </div>
          <button onClick={loadData} className="refresh-btn cosmic-btn">
            ⚡ REFRESH
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Portfolio Overview */}
        {portfolioData && (
          <HolographicCard className="portfolio-overview">
            <h2 className="section-title">PORTFOLIO COMMAND CENTER</h2>
            <div className="portfolio-metrics">
              <div className="metric-card">
                <h3>TOTAL VALUE</h3>
                <div className="value-large neon-text">{formatCurrency(portfolioData.totalValue)}</div>
              </div>
              <div className="metric-card">
                <h3>DAY P&L</h3>
                <div className={`value-large ${portfolioData.dayChange >= 0 ? 'profit-glow' : 'loss-glow'}`}>
                  {formatCurrency(portfolioData.dayChange)}
                </div>
                <div className={`percentage ${portfolioData.dayChangePercent >= 0 ? 'profit-glow' : 'loss-glow'}`}>
                  {formatPercent(portfolioData.dayChangePercent)}
                </div>
              </div>
            </div>
          </HolographicCard>
        )}

        {/* Market Data Grid */}
        <HolographicCard className="market-overview">
          <h2 className="section-title">GLOBAL MARKET MATRIX</h2>
          <div className="stock-grid">
            {stockData.map((stock) => (
              <div key={stock.symbol} className="stock-card cosmic-card">
                <div className="stock-header">
                  <h3 className="stock-symbol">{stock.symbol}</h3>
                  <div className="stock-price neon-text">{formatCurrency(stock.price)}</div>
                </div>
                <div className="stock-details">
                  <div className={`change ${stock.change >= 0 ? 'profit-glow' : 'loss-glow'}`}>
                    {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)}
                    <span className="change-percent">
                      ({formatPercent(stock.changePercent)})
                    </span>
                  </div>
                  <div className="volume">
                    Volume: {formatNumber(stock.volume)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </HolographicCard>

        {/* Holdings Matrix */}
        {portfolioData?.holdings && (
          <HolographicCard className="holdings-matrix">
            <h2 className="section-title">ACTIVE POSITIONS</h2>
            <div className="holdings-grid">
              {portfolioData.holdings.map((holding) => (
                <div key={holding.symbol} className="holding-card cosmic-card">
                  <div className="holding-header">
                    <span className="holding-symbol neon-text">{holding.symbol}</span>
                    <span className="holding-quantity">{formatNumber(holding.quantity)} shares</span>
                  </div>
                  <div className="holding-metrics">
                    <div className="metric">
                      <span>Avg Price:</span>
                      <span>{formatCurrency(holding.averagePrice)}</span>
                    </div>
                    <div className="metric">
                      <span>Current:</span>
                      <span>{formatCurrency(holding.currentPrice)}</span>
                    </div>
                    <div className="metric">
                      <span>Value:</span>
                      <span>{formatCurrency(holding.totalValue)}</span>
                    </div>
                    <div className={`metric pnl ${holding.unrealizedPL >= 0 ? 'profit-glow' : 'loss-glow'}`}>
                      <span>P&L:</span>
                      <span>{formatCurrency(holding.unrealizedPL)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </HolographicCard>
        )}
      </main>

      {/* Floating ticker tape */}
      <div className="ticker-tape">
        <div className="ticker-content">
          {stockData.map((stock, index) => (
            <span key={index} className="ticker-item">
              {stock.symbol}: {formatCurrency(stock.price)}
              <span className={stock.change >= 0 ? 'profit-glow' : 'loss-glow'}>
                {stock.change >= 0 ? ' ↗ ' : ' ↘ '}{formatPercent(stock.changePercent)}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;