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

  document.getElementById('status').innerText = 'Logged in! Creating your playlist...';

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

  // Get time of day
  const hour = new Date().getHours();
  const vibe = (hour >= 6 && hour < 12) ? 'morning'
            : (hour >= 12 && hour < 18) ? 'afternoon'
            : (hour >= 18 && hour < 22) ? 'evening'
            : 'night';

  // Get audio features for all tracks  
  const selectedTracks = [];
  const trackIds = allTracks.map(t => t.id);
  for (let i = 0; i < trackIds.length; i += 100) {
    const chunk = trackIds.slice(i, i + 100);
    const featuresRes = await fetch(`https://api.spotify.com/v1/audio-features?ids=${chunk.join(',')}`, { headers });
    const featuresData = await featuresRes.json();

    featuresData.audio_features.forEach((feature, index) => {
      if (!feature) return;  

      const matchesVibe =
        (vibe === 'morning' && feature.energy > 0.7 && feature.valence > 0.5) ||
        (vibe === 'afternoon' && feature.danceability > 0.6 && feature.energy > 0.5) ||
        (vibe === 'evening' && feature.acousticness > 0.4 && feature.valence < 0.6) ||
        (vibe === 'night' && feature.valence < 0.4 && feature.energy < 0.5);

      if (matchesVibe) {
        selectedTracks.push(allTracks[i + index].uri);
      }
    });

    if (selectedTracks.length >= 20) break;
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
      description: `Generated based on your audio features & time of day.`,
      public: true
    })
  }).then(res => res.json());

  // Add tracks
  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ uris: selectedTracks.slice(0, 30) }) // cap to 30 max
  });

  document.getElementById('status').innerText = `Your "${playlist.name}" was created and added to your Spotify!`;
};
