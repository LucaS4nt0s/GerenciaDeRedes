const request = require('supertest');
const app = require('../app');

describe('App Server', () => {
	describe('GET /health/live', () => {
		it('should return 200 with alive status', async () => {
			const res = await request(app).get('/health/live');
			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('status', 'alive');
			expect(res.body).toHaveProperty('uptime');
		});
	});

	describe('GET /health/ready', () => {
		it('should return 200 with ready status', async () => {
			const res = await request(app).get('/health/ready');
			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('status', 'ready');
		});
	});

	describe('GET /metrics', () => {
		it('should return 200 with prometheus metrics', async () => {
			const res = await request(app).get('/metrics');
			expect(res.status).toBe(200);
			expect(res.text).toContain('http_requests_total');
			expect(res.headers['content-type']).toMatch(/text\/plain/);
		});
	});

	describe('GET /', () => {
		it('should return 200 and serve static index.html', async () => {
			const res = await request(app).get('/');
			expect(res.status).toBe(200);
			expect(res.headers['content-type']).toMatch(/text\/html/);
		});
	});

	describe('POST /register', () => {
		it('should return 400 when username and password are missing', async () => {
			const res = await request(app).post('/register').send({});
			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty('error');
		});

		it('should register a new user', async () => {
			const username = `testuser_${Date.now()}`;
			const res = await request(app).post('/register').send({ username, password: 'secret123' });
			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty('username', username);
			expect(res.body).toHaveProperty('id');
		});

		it('should return 409 when registering duplicate user', async () => {
			const username = `dupuser_${Date.now()}`;
			await request(app).post('/register').send({ username, password: 'secret123' });
			const res = await request(app).post('/register').send({ username, password: 'secret123' });
			expect(res.status).toBe(409);
			expect(res.body).toHaveProperty('error');
		});
	});

	describe('POST /login', () => {
		it('should return 401 for invalid credentials', async () => {
			const res = await request(app).post('/login').send({ username: 'nonexistent', password: 'wrong' });
			expect(res.status).toBe(401);
			expect(res.body).toHaveProperty('error', 'invalid credentials');
		});

		it('should login successfully with valid credentials', async () => {
			const username = `loginuser_${Date.now()}`;
			await request(app).post('/register').send({ username, password: 'mypass' });
			const res = await request(app).post('/login').send({ username, password: 'mypass' });
			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('success', true);
		});
	});

	describe('GET /users', () => {
		it('should return an array of users without passwords', async () => {
			const res = await request(app).get('/users');
			expect(res.status).toBe(200);
			expect(Array.isArray(res.body)).toBe(true);
			if (res.body.length > 0) {
				expect(res.body[0]).not.toHaveProperty('password');
			}
		});
	});
});
