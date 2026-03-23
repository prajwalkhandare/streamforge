// tests/smoke/health-check.js
// Quick smoke test after deployment

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
};

export default function() {
  const endpoints = [
    '/health',
    '/api/health',
    '/'
  ];
  
  endpoints.forEach(endpoint => {
    const res = http.get(`${__ENV.BASE_URL}${endpoint}`);
    check(res, {
      [`${endpoint} status is 200`]: (r) => r.status === 200,
    });
  });
}
