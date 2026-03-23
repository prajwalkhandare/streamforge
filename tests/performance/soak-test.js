// tests/performance/soak-test.js
// Soak test - long duration to find memory leaks

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '1h',  // Run for 1 hour
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function() {
  const endpoints = [
    '/health',
    '/api/videos',
    '/api/user/profile',
    '/api/search?q=action'
  ];
  
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${__ENV.BASE_URL}${endpoint}`);
  
  check(res, { 'status is 200': (r) => r.status === 200 });
  
  sleep(Math.random() * 5 + 1);
}
