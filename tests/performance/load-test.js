// tests/performance/load-test.js
// k6 load testing script for StreamForge API

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_duration');
const videoRequests = new Counter('video_requests');
const authRequests = new Counter('auth_requests');

// Test configuration
export const options = {
  // Test stages - ramp up, stay, ramp down
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 50 },  // Ramp to 50 users
    { duration: '5m', target: 100 }, // Ramp to 100 users
    { duration: '10m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0
  ],
  
  // Thresholds - what's acceptable
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // <1% failure rate
    errors: ['rate<0.05'],             // <5% custom errors
    api_duration: ['p(99)<1000'],      // 99th percentile < 1s
  },
  
  // Virtual user configuration
  vus: 1,
  duration: '1m',
  
  // Test data
  ext: {
    loadimpact: {
      projectID: 123456,
      name: 'StreamForge Load Test'
    }
  }
};

// Setup function - runs once before test
export function setup() {
  console.log('🚀 Starting StreamForge load test');
  
  // Get authentication token
  const loginRes = http.post(`${__ENV.BASE_URL}/api/auth/login`, JSON.stringify({
    username: 'testuser',
    password: 'testpass123'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  const token = loginRes.json('token');
  
  return { token };
}

// Main test function - runs for each virtual user
export default function(data) {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:5000';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
    'User-Agent': 'k6-load-test'
  };
  
  group('Health Check', () => {
    const start = Date.now();
    const res = http.get(`${baseUrl}/health`, { headers });
    const duration = Date.now() - start;
    
    apiLatency.add(duration);
    errorRate.add(res.status !== 200);
    
    check(res, {
      'health status is 200': (r) => r.status === 200,
      'health response has status': (r) => r.json('status') === 'healthy',
    });
    
    sleep(1);
  });
  
  group('Browse Videos', () => {
    // Get video list
    const browseRes = http.get(`${baseUrl}/api/videos?page=1&limit=20`, { headers });
    
    check(browseRes, {
      'browse status is 200': (r) => r.status === 200,
      'browse returns videos': (r) => r.json('videos').length > 0,
    });
    
    videoRequests.add(1);
    
    if (browseRes.status === 200 && browseRes.json('videos').length > 0) {
      const videos = browseRes.json('videos');
      const randomVideo = videos[Math.floor(Math.random() * videos.length)];
      
      // Get video details
      const detailsRes = http.get(`${baseUrl}/api/videos/${randomVideo.id}`, { headers });
      
      check(detailsRes, {
        'video details status is 200': (r) => r.status === 200,
        'video has stream URL': (r) => r.json('streamUrl') !== undefined,
      });
    }
    
    sleep(2);
  });
  
  group('Authentication', () => {
    // Get user profile
    const profileRes = http.get(`${baseUrl}/api/user/profile`, { headers });
    
    check(profileRes, {
      'profile status is 200': (r) => r.status === 200,
      'profile has user data': (r) => r.json('username') !== undefined,
    });
    
    authRequests.add(1);
    
    sleep(1);
  });
  
  group('Watch History', () => {
    // Get watch history
    const historyRes = http.get(`${baseUrl}/api/user/history`, { headers });
    
    check(historyRes, {
      'history status is 200': (r) => r.status === 200,
    });
    
    // Update watch progress
    if (historyRes.status === 200) {
      const updateRes = http.post(`${baseUrl}/api/user/progress`, JSON.stringify({
        videoId: '123',
        progress: Math.random() * 100,
        timestamp: Date.now()
      }), { headers });
      
      check(updateRes, {
        'progress update status is 200': (r) => r.status === 200,
      });
    }
    
    sleep(3);
  });
  
  group('Search', () => {
    const searchTerms = ['action', 'comedy', 'drama', 'thriller', 'sci-fi'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    
    const searchRes = http.get(`${baseUrl}/api/search?q=${term}&page=1`, { headers });
    
    check(searchRes, {
      'search status is 200': (r) => r.status === 200,
      'search returns results': (r) => r.json('results') !== undefined,
    });
    
    sleep(1);
  });
  
  // Simulate user think time
  sleep(Math.random() * 5 + 2); // 2-7 seconds
}

// Teardown function - runs once after test
export function teardown(data) {
  console.log('✅ Load test completed');
  console.log(`📊 Total video requests: ${videoRequests.value}`);
  console.log(`📊 Total auth requests: ${authRequests.value}`);
}
