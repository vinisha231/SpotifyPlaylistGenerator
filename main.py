import spotipy
from spotipy.oauth2 import SpotifyOAuth
import requests
import datetime
import random 

#Developer app Spotify client id and client secret 
CLIENT_ID = ''
CLIENT_SECRET = ''
REDIRECT_URI = ''

#Openweatherapp
WEATHER_API_KEY = '7c7892f389c4109e518dafd5d58fe83e'
CITY = 'kirkland'

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(client_id=CLIENT_ID,
                                               client_secret=CLIENT_SECRET,
                                               redirect_uri=REDIRECT_URI,
                                               scope="playlist-modify-public playlist-read-private user-library-read"))

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
    try: 
        results = sp.current_user_saved_tracks(limit=50)
        
        liked_songs = [track['track']['id'] for track in results['items']]
        random.shuffle(liked_songs)
        
        return liked_songs
    except Exception as e:
        print(f"Error fetching liked songs: {e}")
        return []

def generate_playlist():
    weather = get_weather()
    time_of_day = get_time_of_day()
    
    playlist_name = f"{weather.capitalize()} {time_of_day} Playlist"
    
    liked_songs = get_liked_songs()
  
    if weather == 'rain':
        if time_of_day == 'morning':
            tracks = liked_songs[:30]   
        elif time_of_day == 'afternoon':
            tracks = liked_songs[10:20]
        elif time_of_day == 'evening':
            tracks = liked_songs[20:30]
        else:   
            tracks = liked_songs[30:40]
    elif weather == 'clear':
        if time_of_day == 'morning':
            tracks = liked_songs[0:10]
        elif time_of_day == 'afternoon':
            tracks = liked_songs[10:20]
        elif time_of_day == 'evening':
            tracks = liked_songs[20:30]
        else:   
            tracks = liked_songs[30:40]
    else:   
        if time_of_day == 'morning':
            tracks = liked_songs[0:10]
        elif time_of_day == 'afternoon':
            tracks = liked_songs[10:20]
        elif time_of_day == 'evening':
            tracks = liked_songs[20:30]
        else:  
            tracks = liked_songs[30:40]
    
    user_id = sp.current_user()['id']
    playlist = sp.user_playlist_create(user_id, playlist_name, public=True)
    playlist_id = playlist['id']
    
    sp.playlist_add_items(playlist_id, tracks)
    print(f"Playlist '{playlist_name}' created and populated successfully!")

if __name__ == "__main__":
    generate_playlist()
