const CLIENT_ID = 'f50c28d4935145c09a0c9e6cf6fa3c1a';
const REDIRECT_URI = 'https://vinisha231.github.io/SpotifyPlaylistGenerator/';
const SCOPES = 'playlist-modify-public playlist-read-private user-library-read';
const WEATHER_API_KEY = 'a8ef8d3a4c8eb76cfba42a6285841edc'; 

// Login button
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

window.onload = async () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  if (!accessToken) return;

  document.getElementById('status').innerText = '🎧 Logged in! Creating your genre-based playlist...';

  const headers = { Authorization: 'Bearer ' + accessToken };
  const weather = await getWeatherCondition();
  const time = getTimeOfDay();
  const emoji = getWeatherEmoji(weather);

  const user = await fetch('https://api.spotify.com/v1/me', { headers }).then(res => res.json());
  const userId = user.id;

  let allTracks = [];
  let offset = 0;
  while (true) {
    const tracksRes = await fetch(`https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`, { headers });
    const trackData = await tracksRes.json();
    if (!trackData.items.length) break;
    allTracks.push(...trackData.items.map(item => item.track));
    offset += 50;
  }
  if (allTracks.length === 0) {
    document.getElementById('status').innerText = 'No liked songs found!';
    return;
  }

  const vibeGenres = {
    morning: ['pop', 'indie pop', 'dance', 'synthpop', 'electropop'],
    afternoon: ['pop', 'edm', 'house', 'dance', 'hip hop'],
    evening: ['lo-fi', 'acoustic', 'r&b', 'soul', 'jazz'],
    night: ['ambient', 'piano', 'classical', 'downtempo', 'sad']
  };

  const vibe = time;
  const selectedTracks = [];

  for (const track of allTracks) {
    const artistId = track.artists[0]?.id;
    if (!artistId) continue;

    const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, { headers });
    const artistData = await artistRes.json();
    const artistGenres = artistData.genres || [];

    const matchesVibe = artistGenres.some(genre =>
      vibeGenres[vibe].some(vibeGenre =>
        genre.toLowerCase().includes(vibeGenre)
      )
    );

    if (matchesVibe) selectedTracks.push(track.uri);
    if (selectedTracks.length >= 30) break;
  }

  if (selectedTracks.length === 0) {
    document.getElementById('status').innerText = 'No tracks matched your genre vibe.';
    return;
  }

  const playlist = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `${weather.charAt(0).toUpperCase() + weather.slice(1)} ${vibe.charAt(0).toUpperCase() + vibe.slice(1)} Vibes ${emoji}`,
      description: `A genre-matched playlist based on weather and time of day.`,
      public: true
    })
  }).then(res => res.json());

  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ uris: selectedTracks })
  });

  document.getElementById('status').innerText = `Your "${playlist.name}" playlist has been added to your Spotify!`;
};
