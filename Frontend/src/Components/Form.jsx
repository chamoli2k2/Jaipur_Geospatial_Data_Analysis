import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Form = ({ features }) => {
  const [columnNames, setColumnNames] = useState([]);
  const [feature1, setFeature1] = useState('');
  const [feature2, setFeature2] = useState('');
  const [plotType, setPlotType] = useState('');
  const [warning, setWarning] = useState('');

  useEffect(() => {
    const fetchColumnNames = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/static/response_data.json');
        setColumnNames(response.data.columns);
      } catch (error) {
        console.error('Error fetching column names:', error);
      }
    };

    fetchColumnNames();
  }, []);

  const handlePlotTypeChange = (e) => {
    const selectedPlotType = e.target.value;
    setPlotType(selectedPlotType);

    if (selectedPlotType === 'time_series_plot' && feature2) {
      setWarning('Feature 2 should be None for Time Series Plot');
    } else {
      setWarning('');
    }
  };

  const handleFeature2Change = (e) => {
    const selectedFeature2 = e.target.value;
    setFeature2(selectedFeature2);

    if (plotType === 'time_series_plot' && selectedFeature2) {
      setWarning('Feature 2 should be None for Time Series Plot');
    } else {
      setWarning('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Feature1:", feature1);  // Debug print
    console.log("Feature2:", feature2);  // Debug print
    console.log("Plot Type:", plotType);  // Debug print

    try {
      const response = await axios.post('http://127.0.0.1:5000/generate_plot', {
        feature1,
        feature2,
        plot_type: plotType,
      });
      console.log('Plot generated:', response.data);
    } catch (error) {
      console.error('Error generating plot:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-4 shadow-md rounded mb-4 text-white">
      <div className="mb-4">
        <label className="block mb-1">Feature 1</label>
        <select
          value={feature1}
          onChange={(e) => setFeature1(e.target.value)}
          className="w-full border p-2 bg-gray-700 text-white"
        >
          <option value="">Select Feature 1</option>
          {columnNames.map((feature, index) => (
            <option key={index} value={feature}>
              {feature}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1">Feature 2</label>
        <select
          value={feature2}
          onChange={handleFeature2Change}
          className="w-full border p-2 bg-gray-700 text-white"
        >
          <option value="">Select Feature 2</option>
          {columnNames.map((feature, index) => (
            <option key={index} value={feature}>
              {feature}
            </option>
          ))}
        </select>
      </div>
      {warning && <div className="mb-4 text-red-500">{warning}</div>}
      <div className="mb-4">
        <label className="block mb-1">Plot Type</label>
        <select
          value={plotType}
          onChange={handlePlotTypeChange}
          className="w-full border p-2 bg-gray-700 text-white"
        >
          <option value="">Select Plot Type</option>
          <option value="scatter">Scatter Plot</option>
          <option value="line">Line Plot</option>
          <option value="box">Box Plot</option>
          <option value="pie">Pie Chart</option>
          <option value="bar">Bar Plot</option>
          <option value="proportional_scatter">Proportional Scatter Plot</option>
          <option value="categorical_scatter">Categorical Scatter Plot</option>
          <option value="density">Density Plot</option>
          <option value="time_series_plot">Time Series Plot</option>
        </select>
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Submit</button>
    </form>
  );
};

export default Form;
