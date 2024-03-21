// communicator.spec.js
import { sendMessageToServer, handleServerResponse } from './communicatortest.js';
import fetch from 'node-fetch';

describe('Server Communication', () => {
    let fetchMock;
    
    beforeEach(() => {
        // Mock the default export of the fetch module
        fetchMock = jest.spyOn(fetch, 'default').mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ response: 'Test response' }),
            })
        );
    });

    afterEach(() => {
        // Restore the original implementation
        fetchMock.mockRestore();
    });

    it('sends message to server', async () => {
        await sendMessageToServer('Test message');
        expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage: 'Test message' }),
        });
    });

    it('handles server response', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        handleServerResponse('Test response');
        expect(consoleSpy).toHaveBeenCalledWith('Response from GPT:', 'Test response');
        consoleSpy.mockRestore();
    });
});
