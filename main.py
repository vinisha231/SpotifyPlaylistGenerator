import requests
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import datetime

CLIENT_ID = ''
CLIENT_SECRET = ''
REDIRECT_URI = ''

WEATHER_API_KEY = '7c7892f389c4109e518dafd5d58fe83e'
CITY = 'kirkland'
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(client_id=CLIENT_ID,
                                               client_secret=CLIENT_SECRET,
                                               redirect_uri=REDIRECT_URI,
                                               scope="playlist-modify-public playlist-read-private user-library-read"))

#OpenWeatherMap
def get_weather():
    url = f'http://api.openweathermap.org/data/2.5/weather?q={CITY}&appid={WEATHER_API_KEY}&units=metric'
    response = requests.get(url).json()
    
    if response.get('weather'):
        main_weather = response['weather'][0]['main'].lower()
        return main_weather
    return 'clear'

def get_time_of_day():
    hour = datetime.datetime.now().hour
    if 6 <= hour < 12:
        return 'morning'
    elif 12 <= hour < 18:
        return 'afternoon'
    elif 18 <= hour < 22:
        return 'evening'
    else:
        return 'night'

def get_liked_songs():
    all_songs = []
    offset = 0
    while True:
        results = sp.current_user_saved_tracks(limit=50, offset=offset)
        if not results['items']:
            break
        for item in results['items']:
            all_songs.append(item['track'])
        offset += 50
    return all_songs

def get_artist_genre(artist_id):
    artist_info = sp.artist(artist_id)
    return artist_info.get('genres', [])

def get_playlist_mood(weather, time_of_day):
    if weather in ['clear', 'sunny']:
        if time_of_day in ['morning', 'afternoon']:
            return 'exciting'  
        else:
            return 'calm' 
    elif weather in ['rain', 'clouds']:
        return 'calm'  
    else:
        return 'neutral'  

def generate_playlist():
    weather = get_weather()
    time_of_day = get_time_of_day()
    playlist_mood = get_playlist_mood(weather, time_of_day)
    
    # Get all liked songs
    liked_songs = get_liked_songs()
    #print(f"Total liked songs: {len(liked_songs)}")  

    selected_songs = []

    for song in liked_songs:
        artist_id = song['artists'][0]['id'] 
        genres = get_artist_genre(artist_id)  

        if playlist_mood == 'exciting' and any(genre in ['pop', 'rock', 'dance', 'edm'] for genre in genres):
            selected_songs.append(song['id'])
        
        elif playlist_mood == 'calm' and any(genre in ['classical', 'jazz', 'acoustic', 'ambient'] for genre in genres):
            selected_songs.append(song['id'])

    if len(selected_songs) < 50:
        remaining_songs = set([song['id'] for song in liked_songs]) - set(selected_songs)
        selected_songs.extend(list(remaining_songs)[:50 - len(selected_songs)])

    user_id = sp.current_user()['id']
    playlist_name = f"{weather.capitalize()} {time_of_day} Playlist"
    playlist = sp.user_playlist_create(user_id, playlist_name, public=True)
    playlist_id = playlist['id']

    sp.playlist_add_items(playlist_id, selected_songs[:50])  # Ensure there are 50 songs
    print(f"Playlist '{playlist_name}' created with {len(selected_songs[:50])} songs!")

if __name__ == "__main__":
    generate_playlist()
