// tests/performance/spike-test.js
// Spike test - sudden traffic surge

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Normal
    { duration: '5s', target: 500 },   // SPIKE!
    { duration: '30s', target: 500 },  // Stay at spike
    { duration: '10s', target: 10 },   // Back to normal
    { duration: '1m', target: 0 },     // Ramp down
  ],
};

export default function() {
  const res = http.get(`${__ENV.BASE_URL}/api/videos/trending`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
