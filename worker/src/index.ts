import { verifyMessage } from 'ethers';

export interface Env {
	WEB3_UNIVERSITY_KV: KVNamespace;
}

type SignedProfile = {
	address: string;
	nickname: string;
	signature: string;
	message: string;
	updatedAt: number;
};

// 统一 JSON + CORS
function jsonWithCors(body: unknown, status: number = 200): Response {
	const headers = new Headers();
	headers.set('Content-Type', 'application/json; charset=utf-8');
	headers.set('Access-Control-Allow-Origin', '*');
	headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
	headers.set('Access-Control-Allow-Headers', 'Content-Type');
	return new Response(body === null ? '' : JSON.stringify(body), { status, headers });
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// 预检请求
		if (request.method === 'OPTIONS') {
			return jsonWithCors(null, 204);
		}

		// -------- GET /profile?address=0x... 读取昵称 --------
		if (request.method === 'GET' && url.pathname === '/profile') {
			const address = url.searchParams.get('address');
			if (!address) {
				return jsonWithCors({ error: 'address required' }, 400);
			}

			const key = `profile:${address.toLowerCase()}`;
			const stored = await env.WEB3_UNIVERSITY_KV.get(key);

			if (!stored) {
				return jsonWithCors({ profile: null }, 200);
			}

			const profile = JSON.parse(stored) as SignedProfile;
			return jsonWithCors({ profile }, 200);
		}

		// -------- POST /profile  验签 + 写入昵称 --------
		if (request.method === 'POST' && url.pathname === '/profile') {
			let payload: Partial<SignedProfile>;

			try {
				payload = (await request.json()) as Partial<SignedProfile>;
			} catch {
				return jsonWithCors({ error: 'invalid json body' }, 400);
			}

			const { address, nickname, signature, message } = payload;

			if (!address || !nickname || !signature || !message) {
				return jsonWithCors({ error: 'address, nickname, message, signature required' }, 400);
			}

			if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
				return jsonWithCors({ error: 'invalid address' }, 400);
			}

			const trimmedNickname = nickname.trim();
			if (!trimmedNickname) {
				return jsonWithCors({ error: 'empty nickname' }, 400);
			}

			// 验证签名
			let recovered: string;
			try {
				recovered = verifyMessage(message, signature);
			} catch (e) {
				console.error('verifyMessage error', e);
				return jsonWithCors({ error: 'failed to verify signature' }, 400);
			}

			if (recovered.toLowerCase() !== address.toLowerCase()) {
				return jsonWithCors({ error: 'signature does not match address' }, 401);
			}

			const profile: SignedProfile = {
				address: address.toLowerCase(),
				nickname: trimmedNickname,
				signature,
				message,
				updatedAt: Date.now(),
			};

			const key = `profile:${address.toLowerCase()}`;
			await env.WEB3_UNIVERSITY_KV.put(key, JSON.stringify(profile));

			return jsonWithCors({ success: true, profile }, 200);
		}

		// 其它路径
		return jsonWithCors({ error: 'Not Found' }, 404);
	},
} satisfies ExportedHandler<Env>;
