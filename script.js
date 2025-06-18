const CLIENT_ID = 'f50c28d4935145c09a0c9e6cf6fa3c1a';
const REDIRECT_URI = 'https://vinisha231.github.io/SpotifyPlaylistGenerator/';
const SCOPES = 'playlist-modify-public playlist-read-private user-library-read';
const WEATHER_API_KEY = 'a8ef8d3a4c8eb76cfba42a6285841edc'; 

document.getElementById('login-btn').addEventListener('click', () => {
  const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&show_dialog=true`;
  window.location.href = url;
});

async function getWeatherMood() {
  const city = 'Kirkland';
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}`);
  const data = await res.json();
  return data.weather?.[0]?.main?.toLowerCase() || 'clear';
}

function getTimeOfDayMood() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function updateProgress(percent) {
  document.getElementById('progress-container').style.display = 'block';
  document.getElementById('progress-bar').style.width = `${percent}%`;
}

window.onload = async () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');

  if (!accessToken) return;

  document.getElementById('status').innerText = 'Logged in! Creating your playlist...';
  updateProgress(10);

  const headers = { Authorization: 'Bearer ' + accessToken };

  const [weather, time] = await Promise.all([getWeatherMood(), getTimeOfDayMood()]);
  const vibe = `${weather}-${time}`; // e.g., "clear-morning"
  updateProgress(20);

  const user = await fetch('https://api.spotify.com/v1/me', { headers }).then(res => res.json());
  const userId = user.id;
  updateProgress(30);

  // Fetch liked songs
  let allTracks = [];
  let offset = 0;
  while (true) {
    const res = await fetch(`https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`, { headers });
    const data = await res.json();
    if (!data.items.length) break;
    allTracks.push(...data.items.map(item => item.track));
    offset += 50;
  }
  if (allTracks.length === 0) {
    document.getElementById('status').innerText = 'No liked songs found!';
    return;
  }
  updateProgress(50);

  // Genre filters by vibe
  const moodGenres = {
    'clear-morning': ['pop', 'dance'],
    'clear-afternoon': ['rock', 'funk'],
    'clear-evening': ['rnb', 'soul'],
    'clear-night': ['ambient', 'acoustic'],
    'rain-morning': ['lofi', 'jazz'],
    'rain-afternoon': ['indie', 'folk'],
    'rain-evening': ['classical', 'instrumental'],
    'rain-night': ['blues', 'slowcore'],
    'clouds-morning': ['chill', 'dream pop'],
    'clouds-night': ['ambient', 'minimal']
  };

  const allowedGenres = moodGenres[vibe] || ['pop'];

  const selectedTracks = [];
  for (const track of allTracks) {
    const artists = await fetch(`https://api.spotify.com/v1/artists/${track.artists[0].id}`, { headers }).then(res => res.json());
    const genres = artists.genres || [];
    if (genres.some(genre => allowedGenres.includes(genre.toLowerCase()))) {
      selectedTracks.push(track.uri);
    }
    if (selectedTracks.length >= 30) break;
  }
  updateProgress(80);

  if (selectedTracks.length === 0) {
    document.getElementById('status').innerText = 'No tracks matched your vibe.';
    return;
  }

  const playlist = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `${weather} ${time} Vibes`,
      description: `Auto-generated playlist for ${weather} ${time}`,
      public: true
    })
  }).then(res => res.json());

  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ uris: selectedTracks })
  });
  updateProgress(100);

  document.getElementById('status').innerText = `Your "${playlist.name}" playlist is ready! 🎧`;
};
