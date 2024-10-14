import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Aptos } from "@aptos-labs/ts-sdk";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
interface Playlist {
  playlistName: string;
  musics: number[];
}

interface PlaylistPageProps {
  walletAddress: string;
}
const aptos = new Aptos();
const PlaylistPage = () => {
    const { account, signAndSubmitTransaction } = useWallet();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [newMusic, setNewMusic] = useState<string>('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
const walletAddress = account?.address;
  // Fetch playlists for the wallet address
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await axios.get<Playlist[]>(`http://localhost:5000/playlists/${walletAddress}`);
        setPlaylists(response.data);
      } catch (err) {
        console.error('Error fetching playlists:', err);
      }
    };
    fetchPlaylists();
  }, [walletAddress]);

  // Create a new playlist
  const createPlaylist = async () => {
    try {
      await axios.post('http://localhost:5000/create-playlist', {
        walletAddress,
        playlistName: newPlaylistName,
      });
      setNewPlaylistName('');
      // Refetch playlists
      const response = await axios.get<Playlist[]>(`http://localhost:5000/playlists/${walletAddress}`);
      setPlaylists(response.data);
    } catch (err) {
      console.error('Error creating playlist:', err);
    }
  };

  // Add music to a playlist
  const addMusicToPlaylist = async () => {
    try {
      await axios.post('http://localhost:5000/add-to-playlist', {
        walletAddress,
        playlistName: selectedPlaylist,
        music: Number(newMusic),
      });
      setNewMusic('');
      // Refetch playlists
      const response = await axios.get<Playlist[]>(`http://localhost:5000/playlists/${walletAddress}`);
      setPlaylists(response.data);
    } catch (err) {
      console.error('Error adding music to playlist:', err);
    }
  };

  return (
    <div>
      <h1>Playlists for Wallet: {walletAddress}</h1>
      
      <div>
        <h2>Create New Playlist</h2>
        <input
          type="text"
          placeholder="Playlist Name"
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
        />
        <button onClick={createPlaylist}>Create Playlist</button>
      </div>

      <div>
        <h2>Add Music to Playlist</h2>
        <select onChange={(e) => setSelectedPlaylist(e.target.value)} value={selectedPlaylist}>
          <option value="">Select Playlist</option>
          {playlists.map((playlist, index) => (
            <option key={index} value={playlist.playlistName}>
              {playlist.playlistName}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Enter Music (as number)"
          value={newMusic}
          onChange={(e) => setNewMusic(e.target.value)}
        />
        <button onClick={addMusicToPlaylist}>Add Music</button>
      </div>

      <div>
        <h2>Your Playlists</h2>
        {playlists.length > 0 ? (
          playlists.map((playlist, index) => (
            <div key={index}>
              <h3>{playlist.playlistName}</h3>
              <ul>
                {playlist.musics.map((music, i) => (
                  <li key={i}>Music {music}</li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p>No playlists available.</p>
        )}
      </div>
    </div>
  );
};

export default PlaylistPage;
