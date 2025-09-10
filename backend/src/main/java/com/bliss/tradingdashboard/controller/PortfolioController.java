package com.bliss.tradingdashboard.controller;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "http://localhost:3000")
public class PortfolioController {
    
    // Data classes
    public static class Holding {
        public String symbol;
        public int quantity;
        public double averagePrice;
        public double currentPrice;
        public double totalValue;
        public double unrealizedPL;
        
        public Holding(String symbol, int quantity, double averagePrice, double currentPrice) {
            this.symbol = symbol;
            this.quantity = quantity;
            this.averagePrice = averagePrice;
            this.currentPrice = currentPrice;
            this.totalValue = quantity * currentPrice;
            this.unrealizedPL = (currentPrice - averagePrice) * quantity;
        }
    }
    
    public static class PortfolioData {
        public double totalValue;
        public double dayChange;
        public double dayChangePercent;
        public List<Holding> holdings;
        
        public PortfolioData(double totalValue, double dayChange, double dayChangePercent, List<Holding> holdings) {
            this.totalValue = totalValue;
            this.dayChange = dayChange;
            this.dayChangePercent = dayChangePercent;
            this.holdings = holdings;
        }
    }
    
    public static class ApiResponse<T> {
        public T data;
        public String message;
        public LocalDateTime timestamp;
        
        public ApiResponse(T data, String message) {
            this.data = data;
            this.message = message;
            this.timestamp = LocalDateTime.now();
        }
    }
    
    // Portfolio summary endpoint
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<PortfolioData>> getPortfolioSummary() {
        // Create sample holdings with some randomization for live feel
        List<Holding> holdings = Arrays.asList(
            new Holding("AAPL", 100, 168.50, 175.43 + (Math.random() - 0.5) * 5),
            new Holding("GOOGL", 25, 2800.00, 2734.56 + (Math.random() - 0.5) * 50),
            new Holding("MSFT", 75, 320.00, 334.78 + (Math.random() - 0.5) * 10),
            new Holding("TSLA", 50, 260.00, 248.90 + (Math.random() - 0.5) * 15),
            new Holding("NVDA", 30, 420.00, 456.12 + (Math.random() - 0.5) * 20),
            new Holding("AMZN", 40, 140.00, 134.85 + (Math.random() - 0.5) * 8)
        );
        
        // Round all values to 2 decimal places
        holdings.forEach(holding -> {
            holding.averagePrice = Math.round(holding.averagePrice * 100.0) / 100.0;
            holding.currentPrice = Math.round(holding.currentPrice * 100.0) / 100.0;
            holding.totalValue = Math.round(holding.totalValue * 100.0) / 100.0;
            holding.unrealizedPL = Math.round(holding.unrealizedPL * 100.0) / 100.0;
        });
        
        // Calculate portfolio totals
        double totalValue = holdings.stream()
            .mapToDouble(h -> h.totalValue)
            .sum();
            
        double totalUnrealizedPL = holdings.stream()
            .mapToDouble(h -> h.unrealizedPL)
            .sum();
            
        // Simulate day change (could be different from unrealized P&L)
        double dayChange = totalUnrealizedPL * 0.3 + (Math.random() - 0.5) * 1000;
        double dayChangePercent = (dayChange / (totalValue - dayChange)) * 100;
        
        // Round final calculations
        totalValue = Math.round(totalValue * 100.0) / 100.0;
        dayChange = Math.round(dayChange * 100.0) / 100.0;
        dayChangePercent = Math.round(dayChangePercent * 100.0) / 100.0;
        
        PortfolioData portfolioData = new PortfolioData(
            totalValue,
            dayChange,
            dayChangePercent,
            holdings
        );
        
        ApiResponse<PortfolioData> response = new ApiResponse<>(
            portfolioData,
            "Portfolio summary retrieved successfully"
        );
        
        return ResponseEntity.ok(response);
    }
    
    // Individual holding endpoint
    @GetMapping("/holdings/{symbol}")
    public ResponseEntity<ApiResponse<Holding>> getHolding(@PathVariable String symbol) {
        // Simulate individual holding lookup
        Holding holding = new Holding(
            symbol.toUpperCase(),
            (int)(Math.random() * 200) + 10, // 10-210 shares
            50.0 + Math.random() * 300, // Average price between $50-350
            60.0 + Math.random() * 400  // Current price between $60-460
        );
        
        // Round values
        holding.averagePrice = Math.round(holding.averagePrice * 100.0) / 100.0;
        holding.currentPrice = Math.round(holding.currentPrice * 100.0) / 100.0;
        holding.totalValue = Math.round(holding.totalValue * 100.0) / 100.0;
        holding.unrealizedPL = Math.round(holding.unrealizedPL * 100.0) / 100.0;
        
        ApiResponse<Holding> response = new ApiResponse<>(
            holding,
            "Holding for " + symbol + " retrieved successfully"
        );
        
        return ResponseEntity.ok(response);
    }
    
    // Portfolio performance endpoint
    @GetMapping("/performance")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPortfolioPerformance() {
        Map<String, Object> performance = new HashMap<>();
        
        // Simulate performance metrics
        performance.put("totalReturn", Math.round((Math.random() * 20 - 5) * 100.0) / 100.0); // -5% to 15%
        performance.put("totalReturnPercent", Math.round((Math.random() * 25 - 5) * 100.0) / 100.0);
        performance.put("dayReturn", Math.round((Math.random() * 4 - 2) * 100.0) / 100.0); // -2% to 2%
        performance.put("weekReturn", Math.round((Math.random() * 6 - 3) * 100.0) / 100.0);
        performance.put("monthReturn", Math.round((Math.random() * 10 - 5) * 100.0) / 100.0);
        performance.put("yearReturn", Math.round((Math.random() * 30 - 10) * 100.0) / 100.0);
        
        // Risk metrics
        performance.put("sharpeRatio", Math.round((Math.random() * 2 + 0.5) * 100.0) / 100.0);
        performance.put("volatility", Math.round((Math.random() * 25 + 10) * 100.0) / 100.0);
        performance.put("maxDrawdown", Math.round((Math.random() * 15 + 2) * 100.0) / 100.0);
        
        ApiResponse<Map<String, Object>> response = new ApiResponse<>(
            performance,
            "Portfolio performance metrics retrieved successfully"
        );
        
        return ResponseEntity.ok(response);
    }
    
    // Portfolio allocation endpoint
    @GetMapping("/allocation")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPortfolioAllocation() {
        List<Map<String, Object>> allocation = Arrays.asList(
            createAllocationItem("AAPL", 28.5, "Technology"),
            createAllocationItem("GOOGL", 22.3, "Technology"), 
            createAllocationItem("MSFT", 18.7, "Technology"),
            createAllocationItem("TSLA", 12.4, "Automotive"),
            createAllocationItem("NVDA", 10.8, "Technology"),
            createAllocationItem("AMZN", 7.3, "E-commerce")
        );
        
        ApiResponse<List<Map<String, Object>>> response = new ApiResponse<>(
            allocation,
            "Portfolio allocation retrieved successfully"
        );
        
        return ResponseEntity.ok(response);
    }
    
    private Map<String, Object> createAllocationItem(String symbol, double percentage, String sector) {
        Map<String, Object> item = new HashMap<>();
        item.put("symbol", symbol);
        item.put("percentage", Math.round(percentage * 100.0) / 100.0);
        item.put("sector", sector);
        return item;
    }
}