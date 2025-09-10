package com.bliss.tradingdashboard.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class FinanceApiService {
    
    @Value("${finance.api.key}")
    private String apiKey;
    
    @Value("${finance.api.url}")
    private String apiUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Cache to avoid hitting API rate limits
    private final Map<String, CachedStockData> cache = new ConcurrentHashMap<>();
    private static final int CACHE_DURATION_MINUTES = 5;
    
    // Popular stocks to track
    private final List<String> TRACKED_SYMBOLS = Arrays.asList(
        "AAPL", "GOOGL", "MSFT", "TSLA", "NVDA", "AMZN", "META", "NFLX"
    );
    
    public static class StockData {
        public String symbol;
        public double price;
        public double change;
        public double changePercent;
        public long volume;
        public Long marketCap;
        
        public StockData(String symbol, double price, double change, double changePercent, long volume) {
            this.symbol = symbol;
            this.price = price;
            this.change = change;
            this.changePercent = changePercent;
            this.volume = volume;
        }
    }
    
    private static class CachedStockData {
        public StockData data;
        public LocalDateTime timestamp;
        
        public CachedStockData(StockData data) {
            this.data = data;
            this.timestamp = LocalDateTime.now();
        }
        
        public boolean isExpired() {
            return ChronoUnit.MINUTES.between(timestamp, LocalDateTime.now()) > CACHE_DURATION_MINUTES;
        }
    }
    
    public List<StockData> getAllMarketData() {
        List<StockData> results = new ArrayList<>();
        
        for (String symbol : TRACKED_SYMBOLS) {
            try {
                StockData stockData = getStockData(symbol);
                if (stockData != null) {
                    results.add(stockData);
                }
                
                // Rate limiting - Alpha Vantage allows 5 calls per minute
                Thread.sleep(12000); // 12 seconds between calls = 5 per minute
                
            } catch (Exception e) {
                System.err.println("Error fetching data for " + symbol + ": " + e.getMessage());
                
                // Add fallback data if API fails
                results.add(createFallbackData(symbol));
            }
        }
        
        return results;
    }
    
    public StockData getStockData(String symbol) {
        // Check cache first
        CachedStockData cached = cache.get(symbol);
        if (cached != null && !cached.isExpired()) {
            return cached.data;
        }
        
        try {
            // Alpha Vantage Global Quote API
            String url = String.format(
                "%s?function=GLOBAL_QUOTE&symbol=%s&apikey=%s",
                apiUrl, symbol, apiKey
            );
            
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            // Check for API error
            if (root.has("Error Message")) {
                throw new RuntimeException("API Error: " + root.get("Error Message").asText());
            }
            
            if (root.has("Note")) {
                throw new RuntimeException("API Rate Limit: " + root.get("Note").asText());
            }
            
            JsonNode quote = root.get("Global Quote");
            if (quote == null) {
                throw new RuntimeException("No data returned for symbol: " + symbol);
            }
            
            // Parse Alpha Vantage response
            double price = quote.get("05. price").asDouble();
            double change = quote.get("09. change").asDouble();
            String changePercentStr = quote.get("10. change percent").asText().replace("%", "");
            double changePercent = Double.parseDouble(changePercentStr);
            long volume = quote.get("06. volume").asLong();
            
            StockData stockData = new StockData(symbol, price, change, changePercent, volume);
            
            // Cache the result
            cache.put(symbol, new CachedStockData(stockData));
            
            return stockData;
            
        } catch (Exception e) {
            System.err.println("Error fetching real data for " + symbol + ": " + e.getMessage());
            
            // Return cached data if available, otherwise fallback
            if (cached != null) {
                return cached.data;
            }
            
            return createFallbackData(symbol);
        }
    }
    
    // Fallback data in case API fails
    private StockData createFallbackData(String symbol) {
        Map<String, Double> basePrices = Map.of(
            "AAPL", 175.0, "GOOGL", 2700.0, "MSFT", 330.0, "TSLA", 250.0,
            "NVDA", 450.0, "AMZN", 140.0, "META", 300.0, "NFLX", 440.0
        );
        
        double basePrice = basePrices.getOrDefault(symbol, 100.0);
        double change = (Math.random() - 0.5) * 10;
        double changePercent = (change / basePrice) * 100;
        long volume = (long)(Math.random() * 50000000) + 1000000;
        
        return new StockData(symbol, basePrice + change, change, changePercent, volume);
    }
    
    // Batch update method that respects rate limits
    public void updateAllCachedData() {
        System.out.println("Starting batch update of market data...");
        
        for (String symbol : TRACKED_SYMBOLS) {
            try {
                getStockData(symbol); // This will cache the data
                Thread.sleep(12000); // Rate limiting
            } catch (Exception e) {
                System.err.println("Failed to update " + symbol + ": " + e.getMessage());
            }
        }
        
        System.out.println("Batch update completed.");
    }
    
    // Get cached data without making API calls (for frequent requests)
    public List<StockData> getCachedMarketData() {
        List<StockData> results = new ArrayList<>();
        
        for (String symbol : TRACKED_SYMBOLS) {
            CachedStockData cached = cache.get(symbol);
            if (cached != null) {
                results.add(cached.data);
            } else {
                // If no cached data, add fallback
                results.add(createFallbackData(symbol));
            }
        }
        
        return results;
    }
    
    // Check if we have fresh data
    public boolean hasRecentData() {
        return cache.values().stream()
            .anyMatch(cached -> !cached.isExpired());
    }
}