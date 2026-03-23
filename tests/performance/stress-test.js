// tests/performance/stress-test.js
// Stress test - find breaking point

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // 100 users
    { duration: '5m', target: 500 },  // 500 users
    { duration: '2m', target: 1000 }, // 1000 users
    { duration: '2m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Allow slower under stress
    http_req_failed: ['rate<0.1'],     // Allow 10% failures
  },
};

export default function() {
  const res = http.get(`${__ENV.BASE_URL}/api/videos`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
