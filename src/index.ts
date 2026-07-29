export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		if (path === '/') {
			const obj = await env.R2.get('curriculum.json');
			if (!obj) return new Response('Not Found', { status: 404 });
			return new Response(obj.body, {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Cache-Control': 'public, max-age=3600',
				},
			});
		}

		const id = path.slice(1);
		if (!id || id.includes('/')) {
			return new Response('Not Found', { status: 404 });
		}

		const key = `${id}.pdf`;
		const obj = await env.R2.get(key);
		if (!obj) return new Response('Not Found', { status: 404 });

		const headers = new Headers();
		obj.writeHttpMetadata(headers);
		headers.set('Content-Type', 'application/pdf');
		headers.set('Access-Control-Allow-Origin', '*');

		const title = url.searchParams.get('title');
		if (title) {
			headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(title)}.pdf`);
		}

		return new Response(obj.body, { headers });
	},
} satisfies ExportedHandler<Env>;
