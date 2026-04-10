# Spotify Playlist Generator

A web app that dynamically generates personalized Spotify playlists based on **real-time weather conditions** and **time of day** — because your music should match the moment.

**Live demo:** https://vinisha231.github.io/SpotifyPlaylistGenerator/

> **Note:** The app uses my personal Spotify Developer credentials. To use it, I need to authorize your Spotify account under my app's User Management. Shoot me an email at [viba2022@gmail.com](mailto:viba2022@gmail.com) and I'll add you!

---

## How It Works

1. The app fetches your **current weather** using the OpenWeather API (based on your location or a city input)
2. It maps weather conditions and time of day to a **mood** (e.g., rainy morning → lo-fi chill; sunny afternoon → upbeat pop)
3. It authenticates you with **Spotify OAuth 2.0** and generates a playlist tailored to that mood using the Spotify Web API
4. The playlist is saved directly to your Spotify library

---

## Tech Stack

- **JavaScript** (vanilla, no frameworks)
- **HTML / CSS**
- **Spotify Web API** — playlist creation, search, user library
- **OAuth 2.0** — secure Spotify authentication flow
- **OpenWeather API** — real-time weather data

---

## Features

- Real-time weather detection → mood mapping
- Time-of-day awareness (morning, afternoon, evening, night)
- Playlist auto-generated and saved to your Spotify
- Clean, minimal UI

---

## Local Setup (for forks)

1. Create a Spotify app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a free account at [OpenWeatherMap](https://openweathermap.org/api) and get an API key
3. Add your credentials to `script.js`:
   ```js
   const CLIENT_ID = 'your_spotify_client_id';
   const OPENWEATHER_API_KEY = 'your_openweather_key';
   ```
4. Register `http://localhost:PORT/` or your GitHub Pages URL as a Redirect URI in the Spotify dashboard
5. Serve locally with any static server:
   ```bash
   npx serve .
   ```

---

## Author

**Vinisha Bala Dhayanidhi** · [LinkedIn](https://linkedin.com/in/vinishab) · [GitHub](https://github.com/vinisha231)
