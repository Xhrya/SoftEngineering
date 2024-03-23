import request from 'supertest';
import { decryptContent, server } from './gptserver.js';

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

});
