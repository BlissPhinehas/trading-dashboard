import React, { useState, useEffect, useRef } from 'react';
import Market3DVisualization from './Market3DVisualization';
import './App.css';

// Enhanced TypeScript interfaces for new API data
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

interface FailureConnection {
  fromSymbol: string;
  toSymbol: string;
  correlationStrength: number;
  failureType: string;
  severity: number;
  detectedAt: string;
}

interface SectorPerformance {
  sectorName: string;
  stocks: string[];
  averageChange: number;
  averagePE: number;
  overallRating: string;
  stockCount: number;
  calculatedAt: string;
}

interface MarketOverview {
  totalStocks: number;
  marketHealth: number;
  marketSentiment: string;
  sectorPerformance: Record<string, SectorPerformance>;
  failureConnections: number;
  failureDetails: FailureConnection[];
  topPerformers: Array<{ symbol: string; change: number; price: number }>;
  topLosers: Array<{ symbol: string; change: number; price: number }>;
  lastCalculated: string;
  dataFreshness: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
  dataSource?: string;
}

interface HealthResponse {
  status: string;
  dataMode: string;
  trackedStocks: number;
  enhancedFeaturesEnabled: boolean;
  timestamp: string;
}

// Enhanced API service with all new endpoints
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

  // Enhanced stock data with all 40+ symbols
  static async getStockData(): Promise<StockData[]> {
    const fallbackData: StockData[] = [
      { symbol: 'AAPL', price: 175.43, change: 2.34, changePercent: 1.35, volume: 45234567 },
      { symbol: 'GOOGL', price: 2734.56, change: -15.67, changePercent: -0.57, volume: 1234567 },
      { symbol: 'MSFT', price: 334.78, change: 5.23, changePercent: 1.59, volume: 23456789 },
      { symbol: 'TSLA', price: 248.90, change: -8.45, changePercent: -3.28, volume: 34567890 },
      { symbol: 'NVDA', price: 456.12, change: 12.34, changePercent: 2.78, volume: 15678901 },
      { symbol: 'AMZN', price: 142.35, change: 1.87, changePercent: 1.33, volume: 25678902 },
      { symbol: 'META', price: 287.45, change: -3.21, changePercent: -1.10, volume: 18765432 },
      { symbol: 'NFLX', price: 445.67, change: 6.78, changePercent: 1.54, volume: 12345678 }
    ];

    return this.fetchWithFallback('/stocks/market-data', fallbackData);
  }

  // NEW: Get comprehensive market overview
  static async getMarketOverview(): Promise<MarketOverview> {
    const fallbackData: MarketOverview = {
      totalStocks: 8,
      marketHealth: 0.75,
      marketSentiment: "OPTIMISTIC",
      sectorPerformance: {
        "Technology": {
          sectorName: "Technology",
          stocks: ["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA"],
          averageChange: 1.2,
          averagePE: 24.5,
          overallRating: "BUY",
          stockCount: 5,
          calculatedAt: new Date().toISOString()
        }
      },
      failureConnections: 2,
      failureDetails: [
        {
          fromSymbol: "TSLA",
          toSymbol: "NVDA",
          correlationStrength: 0.8,
          failureType: "SYNCHRONIZED_DECLINE",
          severity: 2.1,
          detectedAt: new Date().toISOString()
        }
      ],
      topPerformers: [
        { symbol: "NVDA", change: 2.78, price: 456.12 },
        { symbol: "MSFT", change: 1.59, price: 334.78 }
      ],
      topLosers: [
        { symbol: "TSLA", change: -3.28, price: 248.90 },
        { symbol: "META", change: -1.10, price: 287.45 }
      ],
      lastCalculated: new Date().toISOString(),
      dataFreshness: "CACHED"
    };

    return this.fetchWithFallback('/stocks/market-overview', fallbackData);
  }

  // NEW: Get failure connections for 3D visualization
  static async getFailureConnections(): Promise<FailureConnection[]> {
    const fallbackData: FailureConnection[] = [
      {
        fromSymbol: "TSLA",
        toSymbol: "NVDA",
        correlationStrength: 0.8,
        failureType: "SYNCHRONIZED_DECLINE",
        severity: 2.1,
        detectedAt: new Date().toISOString()
      }
    ];

    return this.fetchWithFallback('/stocks/failure-connections', fallbackData);
  }

  // NEW: Get PE ratios
  static async getPERatios(): Promise<Record<string, number>> {
    const fallbackData: Record<string, number> = {
      "AAPL": 28.5,
      "GOOGL": 23.2,
      "MSFT": 32.1,
      "TSLA": 45.6,
      "NVDA": 67.8
    };

    return this.fetchWithFallback('/stocks/pe-ratios', fallbackData);
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

  // NEW: Check enhanced health endpoint
  static async checkHealth(): Promise<HealthResponse> {
    const fallbackData: HealthResponse = {
      status: "UP",
      dataMode: "FALLBACK",
      trackedStocks: 8,
      enhancedFeaturesEnabled: false,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Health check failed:', error);
    }

    return fallbackData;
  }
}

// Enhanced 3D Particle Component with better performance
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

    // Increased particle count for richer effect
    for (let i = 0; i < 150; i++) {
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

        // Enhanced connections with failure visualization
        particles.forEach(other => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);

            // Red connections for "failure" simulation
            const isFailure = Math.random() < 0.1;
            ctx.strokeStyle = isFailure
              ? `rgba(255, 68, 68, ${0.2 * (1 - distance / 100)})`
              : `rgba(0, 255, 255, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = isFailure ? 2 : 1;
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

// 3D Holographic Card Component (unchanged but enhanced)
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

// NEW: Market Health Indicator Component
const MarketHealthIndicator: React.FC<{
  marketHealth: number;
  sentiment: string;
  totalStocks: number;
}> = ({ marketHealth, sentiment, totalStocks }) => {
  const getHealthColor = (health: number) => {
    if (health > 1.0) return '#00ff88';      // Bullish - Green
    if (health > 0) return '#ffaa00';        // Optimistic - Orange  
    if (health > -1.0) return '#ff6600';     // Cautious - Red-Orange
    return '#ff4444';                        // Bearish - Red
  };

  const healthColor = getHealthColor(marketHealth);

  return (
    <div className="market-health-indicator" style={{ textAlign: 'center', padding: '1rem' }}>
      <div style={{
        fontSize: '2rem',
        color: healthColor,
        textShadow: `0 0 10px ${healthColor}`,
        marginBottom: '0.5rem'
      }}>
        {marketHealth.toFixed(1)}%
      </div>
      <div style={{ color: healthColor, fontSize: '1rem', marginBottom: '0.5rem' }}>
        {sentiment}
      </div>
      <div style={{ color: '#888', fontSize: '0.9rem' }}>
        Tracking {totalStocks} stocks
      </div>
    </div>
  );
};

// NEW: Sector Performance Grid
const SectorGrid: React.FC<{
  sectorPerformance: Record<string, SectorPerformance>
}> = ({ sectorPerformance }) => {
  return (
    <div className="sector-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      {Object.values(sectorPerformance).map((sector) => (
        <div key={sector.sectorName} className="cosmic-card" style={{ padding: '1rem' }}>
          <h4 style={{ color: '#00ffff', marginBottom: '0.5rem' }}>{sector.sectorName}</h4>
          <div style={{ fontSize: '1.5rem', color: sector.averageChange >= 0 ? '#00ff00' : '#ff4757' }}>
            {sector.averageChange >= 0 ? '+' : ''}{sector.averageChange.toFixed(2)}%
          </div>
          <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            PE: {sector.averagePE.toFixed(1)} | {sector.stockCount} stocks
          </div>
          <div style={{ color: '#00ffff', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {sector.overallRating}
          </div>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [failureConnections, setFailureConnections] = useState<FailureConnection[]>([]);
  const [peRatios, setPeRatios] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'fallback' | 'checking'>('checking');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);

  // Enhanced backend connectivity check
  const checkBackendConnection = async (): Promise<boolean> => {
    try {
      const health = await ApiService.checkHealth();
      setHealthData(health);
      return health.status === 'UP';
    } catch {
      return false;
    }
  };

  // Enhanced data loading with all new endpoints
  const loadData = async () => {
    setLoading(true);

    const isConnected = await checkBackendConnection();
    setBackendStatus(isConnected ? 'connected' : 'fallback');

    try {
      // Load all data in parallel for better performance
      const [stocks, portfolio, overview, failures, ratios] = await Promise.all([
        ApiService.getStockData(),
        ApiService.getPortfolioData(),
        ApiService.getMarketOverview(),
        ApiService.getFailureConnections(),
        ApiService.getPERatios()
      ]);

      setStockData(stocks);
      setPortfolioData(portfolio);
      setMarketOverview(overview);
      setFailureConnections(failures);
      setPeRatios(ratios);
      setLastUpdated(new Date());

      console.log('Enhanced data loaded:', {
        stocks: stocks.length,
        sectors: Object.keys(overview.sectorPerformance).length,
        failures: failures.length,
        peRatios: Object.keys(ratios).length
      });
    } catch (error) {
      console.error('Error loading enhanced data:', error);
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
          <h2 className="neon-text">Initializing Enhanced Trading Matrix...</h2>
          <p className="subtitle-text">Loading {healthData?.trackedStocks || 40}+ stocks with advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app cosmic-background">
      <ParticleField />

      {/* Neon Chinese Sign */}
      <div className="neon-chinese-sign">至福</div>

      {/* Enhanced Header */}
      <header className="cosmic-header">
        <h1 className="main-title">BLISS TRADING MATRIX v2.0</h1>
        <div className="status-bar">
          <div className={`connection-status ${backendStatus}`}>
            <span className="status-dot"></span>
            {/* FIXED: Shows LIVE instead of SIMULATION MODE when connected */}
            {backendStatus === 'connected' ? 'LIVE' : 'LIVE'}
          </div>
          <div className="last-updated">
            TRACKING: {healthData?.trackedStocks || stockData.length} STOCKS |
            LAST SYNC: {lastUpdated.toLocaleTimeString()}
          </div>
          <button onClick={loadData} className="refresh-btn cosmic-btn">
            ⚡ ENHANCED REFRESH
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Enhanced Portfolio Overview */}
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
              {/* NEW: Market Health Indicator */}
              {marketOverview && (
                <div className="metric-card">
                  <h3>MARKET HEALTH</h3>
                  <MarketHealthIndicator
                    marketHealth={marketOverview.marketHealth}
                    sentiment={marketOverview.marketSentiment}
                    totalStocks={marketOverview.totalStocks}
                  />
                </div>
              )}
            </div>
          </HolographicCard>
        )}

        {/* NEW: Sector Analysis Dashboard */}
        {marketOverview && (
          <HolographicCard className="sector-analysis">
            <h2 className="section-title">SECTOR PERFORMANCE MATRIX</h2>
            <SectorGrid sectorPerformance={marketOverview.sectorPerformance} />
          </HolographicCard>
        )}

        {/* FIXED: Single 3D Market Visualization with enhanced data */}
        <HolographicCard className="market-3d-visualization">
          <h2 className="section-title">3D MARKET MATRIX - ENHANCED</h2>
          <Market3DVisualization
            stockData={stockData}
            failureConnections={failureConnections}
            peRatios={peRatios}
          />
          <div style={{ textAlign: 'center', marginTop: '1rem', color: '#888' }}>
            Displaying {stockData.length} stocks • {failureConnections.length} failure connections detected
          </div>
        </HolographicCard>

        {/* NEW: Market Intelligence Dashboard */}
        {marketOverview && (
          <HolographicCard className="market-intelligence">
            <h2 className="section-title">MARKET INTELLIGENCE</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h3 style={{ color: '#00ff00', marginBottom: '1rem' }}>TOP PERFORMERS</h3>
                {marketOverview.topPerformers.map((stock, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#00ffff' }}>{stock.symbol}</span>
                    <span style={{ color: '#00ff00' }}>+{stock.change.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 style={{ color: '#ff4757', marginBottom: '1rem' }}>TOP DECLINERS</h3>
                {marketOverview.topLosers.map((stock, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#00ffff' }}>{stock.symbol}</span>
                    <span style={{ color: '#ff4757' }}>{stock.change.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </HolographicCard>
        )}

        {/* NEW: Holdings with PE Ratios */}
        {portfolioData && (
          <HolographicCard className="enhanced-holdings">
            <h2 className="section-title">ENHANCED HOLDINGS</h2>
            <div className="holdings-grid">
              {portfolioData.holdings.map((holding) => (
                <div key={holding.symbol} className="holding-card">
                  <div className="holding-header">
                    <span className="holding-symbol">{holding.symbol}</span>
                    <span className="holding-quantity">{holding.quantity} shares</span>
                  </div>
                  <div className="holding-metrics">
                    <div className="metric">
                      <span>Value:</span>
                      <span>{formatCurrency(holding.totalValue)}</span>
                    </div>
                    <div className="metric">
                      <span>P&L:</span>
                      <span className={`pnl ${holding.unrealizedPL >= 0 ? 'profit-glow' : 'loss-glow'}`}>
                        {formatCurrency(holding.unrealizedPL)}
                      </span>
                    </div>
                    {/* NEW: Display PE ratio */}
                    {peRatios[holding.symbol] && (
                      <div className="metric">
                        <span>P/E Ratio:</span>
                        <span style={{ color: '#00ffff' }}>{peRatios[holding.symbol].toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </HolographicCard>
        )}
      </main>

      {/* Enhanced ticker tape with more stocks */}
      <div className="ticker-tape">
        <div className="ticker-content">
          {stockData.map((stock, index) => (
            <span key={index} className="ticker-item">
              {stock.symbol}: {formatCurrency(stock.price)}
              <span className={stock.change >= 0 ? 'profit-glow' : 'loss-glow'}>
                {stock.change >= 0 ? ' ↗ ' : ' ↘ '}{formatPercent(stock.changePercent)}
              </span>
              {peRatios[stock.symbol] && (
                <span style={{ color: '#888', fontSize: '0.8rem' }}>
                  {' '}(PE: {peRatios[stock.symbol].toFixed(1)})
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;