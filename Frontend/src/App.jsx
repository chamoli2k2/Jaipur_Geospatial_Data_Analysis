import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import EdaDashboard from './Pages/EdaDashboard.jsx';
import Summary from './Components/Summary.jsx';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EdaDashboard />} />
        <Route path="/summary" element={<Summary />} />
      </Routes>
    </Router>
  );
};

export default App;
