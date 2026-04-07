const express = require('express');
const request = require('supertest');
const { setupRoutes } = require('./routeSetup');

const DEVICE_ID = 11;

const clickData = { pcmData: Buffer.from([0x00, 0x01]), sampleRate: 48000, channels: 2 };
const soundIconMap = new Map([['click', clickData]]);

const mockPlay = jest.fn();

const app = express();
app.use(express.json());
app.use('', setupRoutes(express.Router(), soundIconMap, mockPlay, DEVICE_ID));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /', () => {
    test('returns list of sound icon names', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(['click']);
    });
});

describe('POST /:id', () => {
    test('plays sound and returns 200 for known id', async () => {
        const res = await request(app).post('/click');
        expect(res.status).toBe(200);
        expect(mockPlay).toHaveBeenCalledWith(clickData, DEVICE_ID);
    });

    test('returns 404 for unknown id', async () => {
        const res = await request(app).post('/unknown');
        expect(res.status).toBe(404);
        expect(mockPlay).not.toHaveBeenCalled();
    });
});
