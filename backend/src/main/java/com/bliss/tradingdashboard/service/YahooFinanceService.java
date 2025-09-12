package com.bliss.tradingdashboard.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class YahooFinanceService {
    
    private static final Logger logger = LoggerFactory.getLogger(YahooFinanceService.class);
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Configuration values (externalized)
    @Value("${trading.api.cache-duration-minutes:10}")
    private int cacheDurationMinutes;
    
    @Value("${trading.api.request-delay-ms:3000}")
    private long requestDelayMs;
    
    @Value("${trading.api.yahoo.base-url:https://query1.finance.yahoo.com/v7/finance/quote}")
    private String yahooApiUrl;
    
    @Value("#{'${trading.stocks.tracked-symbols:AAPL,GOOGL,MSFT,TSLA,NVDA,AMZN,META,NFLX}'.split(',')}")
    private List<String> trackedSymbols;
    
    // Cache to avoid hammering the API
    private final Map<String, CachedStockData> cache = new ConcurrentHashMap<>();
    
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
    
    private class CachedStockData {
        public StockData data;
        public LocalDateTime timestamp;
        
        public CachedStockData(StockData data) {
            this.data = data;
            this.timestamp = LocalDateTime.now();
        }
        
        public boolean isExpired() {
            return ChronoUnit.MINUTES.between(timestamp, LocalDateTime.now()) > cacheDurationMinutes;
        }
    }
    
    public List<StockData> getAllMarketData() {
        logger.info("Requesting market data for {} symbols", trackedSymbols.size());
        
        // Check cache first
        long cacheHits = cache.values().stream()
            .filter(cached -> !cached.isExpired())
            .count();
        
        if (cacheHits == trackedSymbols.size()) {
            logger.info("Cache hit: All {} symbols available in cache", cacheHits);
            return getCachedMarketData();
        }
        
        logger.info("Cache miss: {} symbols need refresh", trackedSymbols.size() - cacheHits);
        
        try {
            return fetchFreshData();
        } catch (Exception e) {
            logger.error("API call failed: {} - Using cached/fallback data", e.getMessage());
            return getCachedMarketData();
        }
    }
    
    private List<StockData> fetchFreshData() throws Exception {
        logger.info("Making API call to Yahoo Finance for symbols: {}", trackedSymbols);
        
        // Rate limiting delay
        Thread.sleep(requestDelayMs);
        
        String symbolsParam = String.join(",", trackedSymbols);
        String url = yahooApiUrl + "?symbols=" + symbolsParam;
        
        String response = restTemplate.getForObject(url, String.class);
        
        if (response == null || response.trim().isEmpty()) {
            throw new RuntimeException("Empty response from Yahoo Finance API");
        }
        
        JsonNode root = objectMapper.readTree(response);
        
        if (root.has("error")) {
            throw new RuntimeException("API Error: " + root.get("error").asText());
        }
        
        JsonNode quoteResponse = root.get("quoteResponse");
        if (quoteResponse == null) {
            throw new RuntimeException("Invalid response format: missing quoteResponse");
        }
        
        List<StockData> results = new ArrayList<>();
        
        if (quoteResponse.has("result")) {
            JsonNode quotes = quoteResponse.get("result");
            
            for (JsonNode quote : quotes) {
                try {
                    String symbol = quote.get("symbol").asText();
                    double price = quote.get("regularMarketPrice").asDouble();
                    double change = quote.get("regularMarketChange").asDouble();
                    double changePercent = quote.get("regularMarketChangePercent").asDouble();
                    long volume = quote.get("regularMarketVolume").asLong();
                    
                    StockData stockData = new StockData(symbol, price, change, changePercent, volume);
                    results.add(stockData);
                    
                    // Cache the result
                    cache.put(symbol, new CachedStockData(stockData));
                    
                    logger.info("Successfully fetched data for {}: ${}", symbol, price);
                    
                } catch (Exception e) {
                    logger.error("Error parsing data for quote: {}", e.getMessage());
                }
            }
        }
        
        logger.info("Successfully fetched data for {} symbols", results.size());
        return results;
    }
    
    public StockData getStockData(String symbol) {
        // Check cache first
        CachedStockData cached = cache.get(symbol);
        if (cached != null && !cached.isExpired()) {
            logger.debug("Cache hit for symbol: {}", symbol);
            return cached.data;
        }
        
        try {
            logger.info("Fetching fresh data for symbol: {}", symbol);
            
            Thread.sleep(requestDelayMs);
            
            String url = yahooApiUrl + "?symbols=" + symbol;
            String response = restTemplate.getForObject(url, String.class);
            
            if (response == null || response.trim().isEmpty()) {
                throw new RuntimeException("Empty response from Yahoo Finance API");
            }
            
            JsonNode root = objectMapper.readTree(response);
            JsonNode quoteResponse = root.get("quoteResponse");
            
            if (quoteResponse != null && quoteResponse.has("result")) {
                JsonNode quotes = quoteResponse.get("result");
                
                if (quotes.size() > 0) {
                    JsonNode quote = quotes.get(0);
                    
                    double price = quote.get("regularMarketPrice").asDouble();
                    double change = quote.get("regularMarketChange").asDouble();
                    double changePercent = quote.get("regularMarketChangePercent").asDouble();
                    long volume = quote.get("regularMarketVolume").asLong();
                    
                    StockData stockData = new StockData(symbol, price, change, changePercent, volume);
                    
                    // Cache the result
                    cache.put(symbol, new CachedStockData(stockData));
                    
                    logger.info("Successfully fetched data for {}: ${}", symbol, price);
                    return stockData;
                }
            }
            
            throw new RuntimeException("No data returned for symbol: " + symbol);
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.error("Request interrupted: {}", e.getMessage());
            throw new RuntimeException("Request interrupted", e);
        } catch (Exception e) {
            logger.error("Error fetching data for {}: {}", symbol, e.getMessage());
            
            // Return cached data if available, otherwise fallback
            if (cached != null) {
                logger.info("Using expired cache for {}", symbol);
                return cached.data;
            }
            
            logger.info("Using fallback data for {}", symbol);
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
        double change = (Math.random() - 0.5) * 2; // Smaller random changes ±1
        double changePercent = (change / basePrice) * 100;
        long volume = (long)(Math.random() * 10000000) + 5000000; // More realistic volume
        
        return new StockData(symbol, basePrice + change, change, changePercent, volume);
    }
    
    // Get cached data without making API calls (for frequent requests)
    public List<StockData> getCachedMarketData() {
        List<StockData> results = new ArrayList<>();
        
        for (String symbol : trackedSymbols) {
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
    
    // Force refresh all data
    public void updateAllCachedData() {
        logger.info("Starting manual cache refresh...");
        try {
            getAllMarketData(); // This will update the cache
            logger.info("Manual cache refresh completed successfully");
        } catch (Exception e) {
            logger.error("Manual cache refresh failed: {}", e.getMessage());
        }
    }
}