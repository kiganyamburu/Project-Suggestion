import HTML from './index.html';

export interface Env {
	GEMINI_API_KEY: string;
}

export default {
	async fetch(request, env): Promise<Response> {
		if (request.method === 'GET') {
			return new Response(HTML, { headers: { 'Content-Type': 'text/html' } });
		}

		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
		}

		const username = request.url.split('/').pop() || '';

		const headers = {
			'Content-Type': 'application/json',
			'User-Agent': 'github-roaster/1.0;',
		};

		const _profile = await fetch(`https://api.github.com/users/${username}`, {
			headers: headers,
		});

		if (!_profile.ok) {
			return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
		}

		const profile: any = await _profile.json();

		const repos: any[] = await (
			await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, { headers: headers })
		).json();

		// Prefer non-forks over forks, limit to 5 repos
		const nonForks = repos.filter((repo) => !repo.fork);
		const forks = repos.filter((repo) => repo.fork);

		const selectedRepos = [...nonForks.slice(0, 5), ...forks.slice(0, Math.max(0, 5 - nonForks.length))].slice(0, 5);

		let readme = '';
		try {
			const _readme = await fetch(`https://raw.githubusercontent.com/${username}/${username}/main/README.md`, { headers: headers });
			if (_readme.ok) {
				readme = await _readme.text();
			}
		} catch {}

		const data = {
			name: profile.name,
			bio: profile.bio,
			company: profile.company,
			location: profile.location,
			followers: profile.followers,
			following: profile.following,
			public_repos: profile.public_repos,
			created_at: profile.created_at,
			repos: selectedRepos.map((repo) => ({
				name: repo.name,
				description: repo.description,
				language: repo.language,
				updated_at: repo.updated_at,
				stargazers_count: repo.stargazers_count,
				fork: repo.fork,
				open_issues_count: repo.open_issues_count,
			})),
			readme: readme,
		};

		const prompt = `You are an expert project advisor and career mentor specializing in software development. Analyze the following GitHub profile for @${username} and suggest 3-5 personalized project ideas that would help them grow as a developer.

		Base your suggestions on:
		- Their current skill set (languages, frameworks, tools used in repos)
		- Areas where they could expand their expertise
		- Trends in their recent activity
		- Gaps in their portfolio that would make them more well-rounded
		- Projects that align with their interests (based on bio, repos, and README)

		For each project suggestion:
		1. Give it a catchy, descriptive title (in bold)
		2. Explain what they should build (2-3 sentences)
		3. Mention which skills they'll learn or strengthen
		4. Explain why this project suits their profile specifically

		Write in an encouraging, constructive tone. Be specific and actionable. Format each suggestion as a separate paragraph with double line breaks between them.

		Profile data:
		${JSON.stringify(data, null, 2)}
`;

		let response: any;

		const systemPrompt =
			"You are an expert project advisor and career mentor specializing in software development. Provide personalized project suggestions based on the user's GitHub profile.";

		try {
			const geminiResponse = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						contents: [
							{
								parts: [
									{
										text: `${systemPrompt}\n\n${prompt}`,
									},
								],
							},
						],
						generationConfig: {
							maxOutputTokens: 500,
							temperature: 0.7,
						},
					}),
				}
			);

			if (!geminiResponse.ok) {
				throw new Error('Gemini API request failed');
			}

			const geminiData: any = await geminiResponse.json();
			response = geminiData.candidates[0].content.parts[0].text;
		} catch (e) {
			return new Response(JSON.stringify({ error: 'Failed to generate suggestions. Please try again.' }), { status: 500 });
		}

		// Markdown bold (**text**) and heading (#text) to <b>text</b>
		let formattedResponse = response
			.replace(/(?:^|\n)#\s?([^\n]+)/g, function (match: string, p1: string) {
				return `<b>${p1.trim()}</b>`;
			})
			.replace(/\*\*([^\*]+)\*\*/g, '<b>$1</b>');

		formattedResponse = formattedResponse.replaceAll('\n', '<br>').replaceAll('<br><br>', '<br>');

		return new Response(
			JSON.stringify({
				succes: true,
				suggestions: formattedResponse,
			})
		);
	},
} satisfies ExportedHandler<Env>;
