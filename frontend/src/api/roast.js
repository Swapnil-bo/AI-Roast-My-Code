import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: BASE,
  timeout: 60000,
});

export async function submitRoast(repoUrl, brutality) {
  try {
    const res = await client.post('/api/roast', {
      repo_url: repoUrl,
      brutality,
    });
    return res.data;
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      throw new Error(
        'The roast is taking forever. This might be a Render cold start — try again in 30 seconds.'
      );
    }
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error('Something went wrong. Try again.');
  }
}
