import request from 'supertest'
import express from 'express'

// Mock da aplicação básica para teste
const app = express()

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/instances', (req, res) => {
  res.status(200).json({ instances: [] })
})

describe('API Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200)

    expect(response.body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
    })
  })
})

describe('API Instances Endpoint', () => {
  it('should return instances list', async () => {
    const response = await request(app)
      .get('/api/instances')
      .expect(200)

    expect(response.body).toEqual({
      instances: expect.any(Array),
    })
  })
})
