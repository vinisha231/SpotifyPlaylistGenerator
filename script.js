// script.js
const CLIENT_ID = 'f50c28d4935145c09a0c9e6cf6fa3c1a';
const REDIRECT_URI = 'https://vinisha231.github.io/SpotifyPlaylistGenerator/';
const SCOPES = 'playlist-modify-public playlist-read-private user-library-read';

document.getElementById('login-btn').addEventListener('click', () => {
  const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&show_dialog=true`;
  window.location.href = url;
});

function updateProgress(percent) {
  const bar = document.getElementById('progress-bar');
  bar.style.width = percent + '%';
}

window.onload = async () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');

  if (!accessToken) return;

  document.getElementById('status').innerText = 'Logged in! Creating your playlist...';
  document.getElementById('progress-container').style.display = 'block';
  updateProgress(5);

  const headers = {
    Authorization: 'Bearer ' + accessToken
  };

  // Get user ID
  const userData = await fetch('https://api.spotify.com/v1/me', { headers }).then(res => res.json());
  const userId = userData.id;

  // Get liked songs
  let allTracks = [];
  let offset = 0;
  while (true) {
    const tracksRes = await fetch(`https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`, { headers });
    const trackData = await tracksRes.json();
    if (!trackData.items.length) break;
    allTracks.push(...trackData.items.map(item => item.track));
    offset += 50;
  }
  updateProgress(25);

  if (allTracks.length === 0) {
    document.getElementById('status').innerText = 'No liked songs found!';
    return;
  }

  // Get time of day
  const hour = new Date().getHours();
  const vibe = (hour >= 6 && hour < 12) ? 'morning'
              : (hour >= 12 && hour < 18) ? 'afternoon'
              : (hour >= 18 && hour < 22) ? 'evening'
              : 'night';

  const vibeGenres = {
    morning: ['pop', 'dance', 'indie', 'electropop'],
    afternoon: ['hip hop', 'edm', 'funk', 'rock'],
    evening: ['acoustic', 'jazz', 'soul', 'rnb'],
    night: ['ambient', 'lo-fi', 'classical', 'chill']
  };

  const selectedTracks = [];
  for (let i = 0; i < allTracks.length; i++) {
    const track = allTracks[i];
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

    if (matchesVibe) {
      selectedTracks.push(track.uri);
    }

    if (selectedTracks.length >= 30) break;
    updateProgress(25 + Math.floor((i / allTracks.length) * 50)); // up to 75%
  }

  if (selectedTracks.length < 1) {
    document.getElementById('status').innerText = 'Couldn’t find any tracks that match your vibe.';
    return;
  }

  // Create playlist
  const playlist = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `${vibe.charAt(0).toUpperCase() + vibe.slice(1)} Vibes Playlist`,
      description: `🎶 Curated for your ${vibe} vibes – powered by genre detection!`,
      public: true
    })
  }).then(res => res.json());
  updateProgress(90);

  // Add tracks
  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ uris: selectedTracks })
  });
  updateProgress(100);

  document.getElementById('status').innerText = `Your "${playlist.name}" is live on Spotify!`;

  setTimeout(() => {
    document.getElementById('progress-container').style.display = 'none';
  }, 2000);
};
