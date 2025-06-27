const CLIENT_ID = 'f50c28d4935145c09a0c9e6cf6fa3c1a';
const REDIRECT_URI = 'https://vinisha231.github.io/SpotifyPlaylistGenerator/';
const SCOPES = 'playlist-modify-public playlist-read-private';
const WEATHER_API_KEY = 'a8ef8d3a4c8eb76cfba42a6285841edc';

document.getElementById('login-btn').addEventListener('click', () => {
  const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&show_dialog=true`;
  window.location.href = url;
});

async function getWeatherCondition() {
  const city = 'Kirkland';
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}`);
  const data = await res.json();
  return data.weather?.[0]?.main?.toLowerCase() || 'clear';
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function getWeatherEmoji(condition) {
  const emojis = {
    clear: '☀️',
    rain: '🌧️',
    clouds: '☁️',
    snow: '❄️',
    thunderstorm: '⛈️',
    drizzle: '🌦️',
    mist: '🌫️'
  };
  return emojis[condition] || '🎵';
}

function updateProgress(percent) {
  const container = document.getElementById('progress-container');
  const bar = document.getElementById('progress-bar');
  container.style.display = 'block';
  bar.style.width = `${percent}%`;
}

window.onload = async () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  if (!accessToken) return;

  document.getElementById('status').innerText = '🎧 Logged in! Creating your genre-based playlist...';
  updateProgress(10);

  const headers = { Authorization: 'Bearer ' + accessToken };
  const weather = await getWeatherCondition();
  updateProgress(30);

  const time = getTimeOfDay();
  updateProgress(50);

  const emoji = getWeatherEmoji(weather);

  const user = await fetch('https://api.spotify.com/v1/me', { headers }).then(res => res.json());
  const userId = user.id;
  updateProgress(60);

  const vibeGenres = {
    morning: ['pop', 'indie pop', 'dance', 'synthpop'],
    afternoon: ['pop', 'edm', 'house', 'dance'],
    evening: ['lofi', 'acoustic', 'rnb', 'soul'],
    night: ['ambient', 'piano', 'classical', 'downtempo', 'sad']
  };
  const vibe = time;
  const seedGenres = vibeGenres[vibe] || ['pop'];

  const recsRes = await fetch(`https://api.spotify.com/v1/recommendations?limit=30&seed_genres=${seedGenres.join(',')}`, { headers });
  const recsData = await recsRes.json();
  const recommendedUris = recsData.tracks.map(track => track.uri);
  updateProgress(80);

  if (recommendedUris.length === 0) {
    document.getElementById('status').innerText = 'No fresh tracks found for your vibe.';
    return;
  }

  const playlist = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `${weather.charAt(0).toUpperCase() + weather.slice(1)} ${vibe.charAt(0).toUpperCase() + vibe.slice(1)} Vibes ${emoji}`,
      description: `A fresh playlist generated for the ${vibe} vibe and current weather.`,
      public: true
    })
  }).then(res => res.json());
  updateProgress(90);

  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ uris: recommendedUris })
  });
  updateProgress(100);

  document.getElementById('status').innerHTML = `Your "<a href="https://open.spotify.com/playlist/${playlist.id}" target="_blank">${playlist.name}</a>" playlist has been created!`;
};
