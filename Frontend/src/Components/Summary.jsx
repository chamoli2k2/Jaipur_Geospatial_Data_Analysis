import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SummaryPage = () => {
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('https://jaipur-district-geostats-backend.onrender.com/summary')
      .then((response) => {
        setSummary(response.data);
      })
      .catch((error) => {
        console.error('Error fetching summary:', error);
      });
  }, []);

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-3xl w-full">
        <h1 className="text-4xl font-bold mb-4 text-center">Geospatial Dataset Summary</h1>
        
        {summary ? (
          <div>
            <h2 className="text-2xl font-bold mb-2">Dataset Information</h2>
            <p><strong>Number of Features:</strong> {summary.num_features}</p>
            <p><strong>Number of Attributes:</strong> {summary.num_attributes}</p>
            
            <h2 className="text-2xl font-bold mt-4 mb-2">Geometry Statistics</h2>
            <p><strong>Geometry Type:</strong> {summary.geometry_stats.geometry_type}</p>
            <p><strong>CRS:</strong> {summary.geometry_stats.crs}</p>
            <p><strong>Extent:</strong> {summary.geometry_stats.extent.join(', ')}</p>
            <p><strong>Total Area:</strong> {summary.geometry_stats.area}</p>
            <p><strong>Total Length:</strong> {summary.geometry_stats.length}</p>
          </div>
        ) : (
          <p className="text-center">Loading summary...</p>
        )}

        {/* Back to Homepage Button */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/')} 
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-md transition duration-300"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
