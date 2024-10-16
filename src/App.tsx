import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './NavBar.tsx'; // Import Navbar component
//import App2 from './App2'; // Import App2 component
import App2 from './App2.tsx';
 // Import Home component or create it if necessary
import Upload from './Upload.tsx';
import Earnings from './Earnings.tsx';
import PlaylistPage from './PlaylistPage.tsx';
import TrendingAudioMarketplace from './Trending.tsx';
function App() {
  return (
    <Router>
      <Navbar />  {/* Include the Navbar at the top of the page */}
      <Routes>
         {/* Default route for Home */}
         <Route path="/" element={<App2 />} />
        <Route path="/app2" element={<App2 />} />
        <Route path="/upload" element={<Upload />} /> 
        <Route path="/earnings" element={<Earnings />} /> 
        <Route path="/playlistpage" element={<PlaylistPage />} />{/* Route for App2 (Upload) */}
        <Route path="/trending" element={<TrendingAudioMarketplace />} />
      </Routes>
    </Router>
  );
}

export default App;
