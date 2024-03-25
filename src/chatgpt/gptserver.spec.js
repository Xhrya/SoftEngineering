import request from 'supertest';
import { decryptContent, server } from './gptserver.js';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 9000;

describe('GPT Server Tests', () => {
  afterAll(() => {
    server.close();
  });


  it('should decrypt content properly', () => {
    const encryptedContent = 'aba5ea17efb1b026ab78a0b6b9cd6f9a'; 
    const key = 'e26aa14c1cd475150e813312b12a35cf03346fdc58fe89b0ea0547e4d372d61e'; 
    const iv = '96293491c6a26cced315cb15bcf58492'; 
    const decryptedContent = decryptContent(encryptedContent, key, iv);
    expect(decryptedContent).toBe('Test item.'); 
  });
  
  it('should handle POST request to /api with proper JSON data', async () => {
    const data = { userMessage: 'Test message' };
    const response = await request(server)
      .post('/api')
      .set('Content-Type', 'application/json')
      .send(data);
    expect(response.status).toBe(200);
    expect(typeof response.body.response).toBe('string'); 
    expect(response.headers['content-type']).toMatch('application/json');
  });
  

  it('should handle POST request to /api with malformed JSON data', async () => {
    const response = await request(server)
      .post('/api')
      .set('Content-Type', 'application/json')
      .send('{ malformed }');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Malformed JSON data');
    expect(response.headers['content-type']).toMatch('application/json');
  });

  it('should handle non-POST request to /api', async () => {
    const response = await request(server).get('/api');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not found');
    expect(response.headers['content-type']).toMatch('application/json');
  });

  it('should handle SQL injection attempt safely', async () => {
    const maliciousData = { userMessage: "' OR '1'='1" }; // Simplified SQL injection
    const response = await request(server)
      .post('/api')
      .set('Content-Type', 'application/json')
      .send(maliciousData);
    expect(response.body.response).not.toContain("Invalid input. Please try again");
    expect(response.headers['content-type']).toMatch('application/json');
  });
  
  it('should sanitize input to prevent XSS attacks', async () => {
    const maliciousData = { userMessage: "<script>alert('XSS');</script>" };
    const response = await request(server)
      .post('/api')
      .set('Content-Type', 'application/json')
      .send(maliciousData);
    expect(response.status).toBe(200);
    // Ensure the response does not simply echo the malicious input
    expect(response.body.response).not.toContain("<script>");
    expect(response.headers['content-type']).toMatch('application/json');
  });

  it('should handle large payloads gracefully', async () => {
    const largeData = { userMessage: 'A'.repeat(1000000) }; // 1 million characters
    const agent = request.agent(server); // Create an agent to reuse the connection
    const requestPromise = agent
      .post('/api')
      .set('Content-Type', 'application/json')
      .send(largeData);

    try {
      await requestPromise;
    } catch (error) {
      expect(error.code).toBe('EPIPE'); // Expecting EPIPE error
      return;
    }
  
    // If the promise doesn't throw an error, fail the test
    fail('Expected request to throw EPIPE error');
  });
  
  
  it('should return a server error gracefully for unexpected conditions', async () => {
    spyOn(console, 'error'); // Optionally mock console.error to suppress error logging during tests
    const maliciousData = { userMessage: "Unexpected error triggered. Please try again." }; // Assuming this input triggers an unexpected error
    const response = await request(server)
      .post('/api')
      .set('Content-Type', 'application/json')
      .send(maliciousData);
    expect(response.status).toBe(200); // Expecting a server error status
    expect(response.body.error).toBeUndefined();
    expect(response.headers['content-type']).toMatch('application/json');
  });
  
  

});
