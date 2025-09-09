import React from 'react';

function App() {
  return (
    <div>
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-content">
          <h1 className="logo">TradingView Pro</h1>
          <div className="nav-buttons">
            <button className="nav-button">Dashboard</button>
            <button className="nav-button">Portfolio</button>
            <button className="nav-button">Watchlist</button>
            <button className="login-button">Login</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container">
        <div className="grid grid-3-cols">

          {/* Market Overview */}
          <div>
            <div className="card">
              <h2>Market Overview</h2>
              <div className="market-grid">
                <div className="market-item">
                  <div className="market-value profit">+2.4%</div>
                  <div>S&P 500</div>
                </div>
                <div className="market-item">
                  <div className="market-value profit">+1.8%</div>
                  <div>NASDAQ</div>
                </div>
                <div className="market-item">
                  <div className="market-value loss">-0.5%</div>
                  <div>DOW</div>
                </div>
                <div className="market-item">
                  <div className="market-value profit">+3.2%</div>
                  <div>RUSSELL</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h2>Portfolio Performance</h2>
              <div className="chart-placeholder">
                Interactive Chart Coming Soon
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="card">
              <h2>Portfolio Summary</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span>Total Value</span>
                <span>$125,430.50</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span>Today's P&L</span>
                <span className="profit">+$2,340.25 (+1.9%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total P&L</span>
                <span className="profit">+$25,430.50 (+25.4%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;