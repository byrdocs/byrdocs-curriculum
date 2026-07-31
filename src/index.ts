import curricula from './curricula.json';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		if (path === '/') {
			return new Response(JSON.stringify(curricula), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Cache-Control': 'public, max-age=3600',
				},
			});
		}

		if (!path.startsWith('/file/')) {
			return new Response('Not Found', { status: 404 });
		}

		const id = path.slice('/file/'.length);
		if (!id || id.includes('/')) {
			return new Response('Not Found', { status: 404 });
		}

		const fileUrl = `${env.CURRICULUM_FILE_URL}/${id}.pdf`;
		const response = await fetch(fileUrl);
		if (!response.ok) {
			return new Response('Not Found', { status: 404 });
		}

		const headers = new Headers();
		headers.set('Content-Type', 'application/pdf');
		headers.set('Access-Control-Allow-Origin', '*');

		const title = url.searchParams.get('title');
		if (title) {
			headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(title)}`);
		}

		return new Response(response.body, { headers });
	},
} satisfies ExportedHandler<Env>;
