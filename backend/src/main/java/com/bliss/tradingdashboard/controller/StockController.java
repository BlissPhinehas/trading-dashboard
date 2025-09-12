package com.bliss.tradingdashboard.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bliss.tradingdashboard.service.YahooFinanceService;
import com.bliss.tradingdashboard.service.YahooFinanceService.StockData;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class StockController {

    @Autowired
    private YahooFinanceService yahooFinanceService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("dataMode", "LIVE");
        status.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(status);
    }

    @GetMapping("/stocks/market-data")
    public ResponseEntity<Map<String, Object>> getMarketData() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<StockData> stockData = yahooFinanceService.getAllMarketData();
            response.put("data", stockData);
            response.put("message", "Success");
            response.put("dataSource", "Yahoo Finance Live");
            response.put("timestamp", LocalDateTime.now());
        } catch (Exception e) {
            response.put("data", new java.util.ArrayList<>());
            response.put("message", "Error: " + e.getMessage());
            response.put("dataSource", "Error");
            response.put("timestamp", LocalDateTime.now());
        }
        return ResponseEntity.ok(response);
    }
}