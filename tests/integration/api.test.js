// tests/integration/api.test.js

const request = require('supertest');
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');

const API_URL = process.env.API_URL || 'http://localhost:5000';

describe('StreamForge API Integration Tests', () => {
  
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(API_URL)
        .get('/health')
        .expect(200);
      
      assert.strictEqual(response.body.status, 'healthy');
    });
  });
  
  describe('Videos API', () => {
    it('should return list of videos', async () => {
      const response = await request(API_URL)
        .get('/api/videos?page=1&limit=10')
        .expect(200);
      
      assert(Array.isArray(response.body.videos));
      assert(response.body.videos.length <= 10);
    });
    
    it('should return single video', async () => {
      const response = await request(API_URL)
        .get('/api/videos/1')
        .expect(200);
      
      assert(response.body.id);
      assert(response.body.title);
    });
  });
  
  describe('Search API', () => {
    it('should search videos', async () => {
      const response = await request(API_URL)
        .get('/api/search?q=action')
        .expect(200);
      
      assert(Array.isArray(response.body.results));
    });
  });
});
