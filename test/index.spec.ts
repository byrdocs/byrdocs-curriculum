import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

const MOCK_CURRICULUM = JSON.stringify([
	{
		id: 'testid123',
		title: '测试学院2025级本科专业培养方案',
		school: '测试学院',
		year: '2025',
		major: [{ type: '本科', name: '计算机科学与技术' }],
	},
]);

describe('curriculum API', () => {
	beforeEach(async () => {
		await env.R2.put('curriculum.json', MOCK_CURRICULUM);
		await env.R2.put('testid123.pdf', new Uint8Array([1, 2, 3, 4]));
	});

	describe('GET /', () => {
		it('returns curriculum.json from R2', async () => {
			const request = new IncomingRequest('http://example.com/');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/json');
			const data = await response.json();
			expect(data).toHaveLength(1);
			expect(data[0].title).toBe('测试学院2025级本科专业培养方案');
		});

		it('returns CORS headers', async () => {
			const request = new IncomingRequest('http://example.com/');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});
	});

	describe('GET /:id', () => {
		it('downloads a PDF by id', async () => {
			const request = new IncomingRequest('http://example.com/testid123');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/pdf');
			expect(response.headers.get('Content-Disposition')).toBeNull();
		});

		it('sets Content-Disposition when ?title= is provided', async () => {
			const request = new IncomingRequest('http://example.com/testid123?title=%E6%B5%8B%E8%AF%95%E6%96%87%E4%BB%B6');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Disposition')).toContain("filename*=UTF-8''%E6%B5%8B%E8%AF%95%E6%96%87%E4%BB%B6.pdf");
		});

		it('returns 404 for missing PDF', async () => {
			const request = new IncomingRequest('http://example.com/nonexistent');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(404);
		});

		it('returns 404 for paths with subdirectories', async () => {
			const request = new IncomingRequest('http://example.com/foo/bar');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(404);
		});
	});

	describe('integration', () => {
		it('GET / returns curriculum (integration)', async () => {
			const response = await SELF.fetch('https://example.com/');
			expect(response.status).toBe(200);
		});

		it('GET /:id returns PDF (integration)', async () => {
			const response = await SELF.fetch('https://example.com/testid123');
			expect(response.status).toBe(200);
		});
	});
});
