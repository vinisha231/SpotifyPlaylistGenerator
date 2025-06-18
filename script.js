const CLIENT_ID = 'f50c28d4935145c09a0c9e6cf6fa3c1a';
const REDIRECT_URI = 'https://vinisha231.github.io/SpotifyPlaylistGenerator/';
const SCOPES = 'playlist-modify-public playlist-read-private user-library-read';

document.getElementById('login-btn').addEventListener('click', () => {
  const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&show_dialog=true`;
  window.location.href = url;
});

window.onload = async () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');

  if (!accessToken) return;

  document.getElementById('status').innerText = '🎧 Logged in! Creating your genre-based playlist...';

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

  if (allTracks.length === 0) {
    document.getElementById('status').innerText = 'No liked songs found!';
    return;
  }

  // Vibe genre mapping based on time
  const hour = new Date().getHours();
  const vibe = (hour >= 6 && hour < 12) ? 'morning'
            : (hour >= 12 && hour < 18) ? 'afternoon'
            : (hour >= 18 && hour < 22) ? 'evening'
            : 'night';

  const vibeGenres = {
    morning: ['pop', 'indie pop', 'dance', 'synthpop', 'electropop'],
    afternoon: ['pop', 'edm', 'house', 'dance', 'hip hop'],
    evening: ['lo-fi', 'acoustic', 'r&b', 'soul', 'jazz'],
    night: ['ambient', 'piano', 'classical', 'downtempo', 'sad']
  };

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

    if (matchesVibe) {
      selectedTracks.push(track.uri);
    }

    if (selectedTracks.length >= 30) break; // max limit for this version
  }

  if (selectedTracks.length === 0) {
    document.getElementById('status').innerText = 'No tracks matched your genre vibe.';
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
      name: `${vibe.charAt(0).toUpperCase() + vibe.slice(1)} Genre Vibes`,
      description: `A genre-matched playlist based on time of day.`,
      public: true
    })
  }).then(res => res.json());

  // Add tracks
  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ uris: selectedTracks })
  });

  document.getElementById('status').innerText = `Your "${playlist.name}" playlist has been added to your Spotify!`;
};
