package com.bliss.tradingdashboard.controller;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bliss.tradingdashboard.service.FinanceApiService;
import com.bliss.tradingdashboard.service.FinanceApiService.StockData;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class StockController {
    
    @Autowired
    private FinanceApiService financeApiService;
    
    public static class ApiResponse<T> {
        public T data;
        public String message;
        public LocalDateTime timestamp;
        public String dataSource;
        
        public ApiResponse(T data, String message, String dataSource) {
            this.data = data;
            this.message = message;
            this.dataSource = dataSource;
            this.timestamp = LocalDateTime.now();
        }
    }
    
    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("timestamp", LocalDateTime.now());
        status.put("service", "Trading Dashboard API");
        status.put("version", "1.0.0");
        status.put("realDataEnabled", true);
        status.put("hasRecentData", financeApiService.hasRecentData());
        return ResponseEntity.ok(status);
    }
    
    // Market data endpoint - returns cached data for fast response
    @GetMapping("/stocks/market-data")
    public ResponseEntity<ApiResponse<List<StockData>>> getMarketData() {
        try {
            List<StockData> stockData = financeApiService.getCachedMarketData();
            
            String dataSource = financeApiService.hasRecentData() ? "Alpha Vantage (cached)" : "Fallback";
            
            ApiResponse<List<StockData>> response = new ApiResponse<>(
                stockData, 
                "Market data retrieved successfully",
                dataSource
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            // Return error response but with fallback data
            List<StockData> fallbackData = financeApiService.getCachedMarketData();
            
            ApiResponse<List<StockData>> response = new ApiResponse<>(
                fallbackData,
                "Using cached/fallback data due to API error: " + e.getMessage(),
                "Fallback"
            );
            
            return ResponseEntity.ok(response);
        }
    }
    
    // Force refresh endpoint - triggers new API calls
    @PostMapping("/stocks/refresh")
    public ResponseEntity<ApiResponse<String>> refreshMarketData() {
        try {
            // Trigger async update
            updateMarketDataAsync();
            
            ApiResponse<String> response = new ApiResponse<>(
                "OK",
                "Market data refresh initiated - data will update in background",
                "Alpha Vantage"
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            ApiResponse<String> response = new ApiResponse<>(
                "ERROR",
                "Failed to initiate refresh: " + e.getMessage(),
                "Error"
            );
            
            return ResponseEntity.ok(response);
        }
    }
    
    // Individual stock data endpoint
    @GetMapping("/stocks/{symbol}")
    public ResponseEntity<ApiResponse<StockData>> getStockBySymbol(@PathVariable String symbol) {
        try {
            StockData stock = financeApiService.getStockData(symbol.toUpperCase());
            
            ApiResponse<StockData> response = new ApiResponse<>(
                stock,
                "Stock data for " + symbol + " retrieved successfully",
                "Alpha Vantage"
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            // Create fallback data for unknown symbol
            StockData fallbackStock = new StockData(
                symbol.toUpperCase(),
                100.0 + Math.random() * 500,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 5,
                1000000L + (long)(Math.random() * 50000000)
            );
            
            ApiResponse<StockData> response = new ApiResponse<>(
                fallbackStock,
                "Real data unavailable for " + symbol + ", using simulated data",
                "Fallback"
            );
            
            return ResponseEntity.ok(response);
        }
    }
    
    // Get data source info
    @GetMapping("/stocks/info")
    public ResponseEntity<Map<String, Object>> getDataSourceInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("provider", "Alpha Vantage");
        info.put("hasRecentData", financeApiService.hasRecentData());
        info.put("updateFrequency", "Every 5 minutes");
        info.put("rateLimit", "5 calls per minute");
        info.put("trackedSymbols", Arrays.asList("AAPL", "GOOGL", "MSFT", "TSLA", "NVDA", "AMZN", "META", "NFLX"));
        info.put("lastUpdate", LocalDateTime.now());
        
        return ResponseEntity.ok(info);
    }
    
    // Async method to update data in background
    @Async
    public CompletableFuture<Void> updateMarketDataAsync() {
        try {
            financeApiService.updateAllCachedData();
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            System.err.println("Background update failed: " + e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }
    
    // Scheduled task to refresh data every 10 minutes
    @Scheduled(fixedRate = 600000) // 10 minutes
    public void scheduledDataRefresh() {
        System.out.println("Starting scheduled market data refresh...");
        updateMarketDataAsync();
    }
}
