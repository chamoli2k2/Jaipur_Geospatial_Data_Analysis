import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMapEvent } from "react-leaflet";
import axios from "axios";
import Plotly from "plotly.js-dist";
import indiaGeoJson from "../constants/india_st.json"; // Adjust path as necessary
import districtGeoJson from "../constants/india_ds.json"; // Adjust path as necessary
import { useNavigate } from "react-router-dom";

const EdaDashboard = () => {
  const [columnNames, setColumnNames] = useState([]);
  const [feature1, setFeature1] = useState("");
  const [feature2, setFeature2] = useState("");
  const [plotType, setPlotType] = useState("");
  const [plotData, setPlotData] = useState(null);
  const [villageGeoJson, setVillageGeoJson] = useState(null);
  const [districtDataGeoJson, setDistrictDataGeoJson] = useState(null);
  const [currentGeoJson, setCurrentGeoJson] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(3);
  const [loading, setLoading] = useState(false); // Added loading state
  const [warning, setWarning] = useState(""); // Warning state
  const navigate = useNavigate();

  const indianBorder = {
    color: "black",
    weight: 2,
    opacity: 0.2,
  };

  useEffect(() => {
    axios
      .get("https://jaipur-district-geostats-backend.onrender.com/static/output_village.geojson")
      .then((response) => setVillageGeoJson(response.data))
      .catch((error) =>
        console.error("Error fetching output_village.geojson:", error)
      );

    axios
      .get("https://jaipur-district-geostats-backend.onrender.com/static/map_data.geojson")
      .then((response) => setDistrictDataGeoJson(response.data))
      .catch((error) =>
        console.error("Error fetching map_data.geojson:", error)
      );

    axios
      .get("https://jaipur-district-geostats-backend.onrender.com/static/response_data.json")
      .then((response) => setColumnNames(response.data.columns))
      .catch((error) => console.error("Error fetching column names:", error));
  }, []);

  useEffect(() => {
    axios
      .get("https://jaipur-district-geostats-backend.onrender.com/static/plot_output.json")
      .then((response) => setPlotData(JSON.parse(response.data)))
      .catch((error) => console.error("Error fetching plot data:", error));
  }, []);

  useEffect(() => {
    if (zoomLevel >= 10) {
      setCurrentGeoJson(villageGeoJson);
    } else {
      setCurrentGeoJson(districtDataGeoJson);
    }
  }, [zoomLevel, districtGeoJson, indiaGeoJson]);

  const handlePlotTypeChange = (e) => {
    const selectedPlotType = e.target.value;
    setPlotType(selectedPlotType);

    if (selectedPlotType === "time_series_plot" && feature2) {
      setWarning("Feature 2 should be None for Time Series Plot");
    } else {
      setWarning("");
    }
  };

  const handleFeature2Change = (e) => {
    const selectedFeature2 = e.target.value;
    setFeature2(selectedFeature2);

    if (plotType === "time_series_plot" && selectedFeature2) {
      setWarning("Feature 2 should be None for Time Series Plot");
    } else {
      setWarning("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Set loading to true on form submission
    try {
      const response = await axios.post("https://jaipur-district-geostats-backend.onrender.com/generate_plot", {
        feature1,
        feature2,
        plot_type: plotType,
      });
      console.log("Plot generated:", response.data);
      setLoading(false); // Set loading to false after the request is completed
      window.location.reload(); // Refresh the page after data is received
    } catch (error) {
      console.error("Error generating plot:", error);
      setLoading(false); // Set loading to false if there's an error
    }
  };

  const ZoomHandler = () => {
    useMapEvent("zoomend", (event) => {
      const newZoomLevel = event.target.getZoom();
      setZoomLevel(newZoomLevel);
    });
    return null;
  };

  const onEachFeature = (feature, layer) => {
    if (feature.properties) {
  
      // Define summaries for different zoom levels
      if (zoomLevel < 10) {
        const name = feature.properties.name || "No name";
        const child = feature.properties.Child11 || "No data";
        const census = feature.properties.censusname || "No data";
        const sexRatio = feature.properties.SexR11 || "No data";
        const scSt = feature.properties.SC_ST11 || "No data";
  
        const summary = `
          <div>
            <strong>${name}</strong><br />
            Census Name: ${census}<br />
            Child Population: ${child}<br />
            Sex Ratio: ${sexRatio}<br />
            SC/ST: ${scSt}
          </div>
        `;
  
        layer.bindTooltip(summary, {
          permanent: false,
          direction: "auto",
        });
      } else if (zoomLevel >= 10) {
        const name = feature.properties.name || "No name";
        const mc = feature.properties.MC || "No data";
        const subdistrict = feature.properties.subdistric || "No data";
        const district = feature.properties.district || "No data";
        const state = feature.properties.state || "No data";
        const censusCode = feature.properties.censuscode || "No data";
  
        const detailedSummary = `
          <div>
            <strong>${name}</strong><br />
            Mc: ${mc}<br />
            Subdistrict: ${subdistrict}<br />
            District: ${district}<br />
            State: ${state}<br />
            Census Code: ${censusCode}
          </div>
        `;
  
        layer.bindTooltip(detailedSummary, {
          permanent: false,
          direction: "auto",
        });
      }
    }
  };
  

  useEffect(() => {
    if (plotData) {
      Plotly.newPlot("plot", plotData.data, plotData.layout);
    }
  }, [plotData]);

  const handlePageChange = () => {
    navigate("/summary");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-yellow-400 flex flex-col">
      <header className="p-4 bg-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-bold text-yellow-500">EDA Dashboard</h1>
        <div className="flex">
          <button onClick={handlePageChange} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-1 px-3 rounded-md mx-1">
            View Summary
          </button>
        </div>
      </header>
  
      <div className="flex-grow p-4 flex flex-col">
        <div className="bg-gray-800 p-3 rounded-md shadow-md mb-4">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="block mb-1 text-sm">Feature 1</label>
              <select
                value={feature1}
                onChange={(e) => setFeature1(e.target.value)}
                className="w-full border-2 border-yellow-500 bg-gray-800 p-2 rounded-md"
              >
                <option value="">Select Feature 1</option>
                {columnNames.map((feature, index) => (
                  <option key={index} value={feature}>
                    {feature}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block mb-1 text-sm">Feature 2</label>
              <select
                value={feature2}
                onChange={handleFeature2Change}
                className="w-full border-2 border-yellow-500 bg-gray-800 p-2 rounded-md"
              >
                <option value="">Select Feature 2</option>
                {columnNames.map((feature, index) => (
                  <option key={index} value={feature}>
                    {feature}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block mb-1 text-sm">Plot Type</label>
              <select
                value={plotType}
                onChange={handlePlotTypeChange}
                className="w-full border-2 border-yellow-500 bg-gray-800 p-2 rounded-md"
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
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-black py-1 px-4 rounded-md"
            >
              {loading ? "Loading..." : "Submit"} {/* Button shows loading effect */}
            </button>
          </form>
          {warning && <p className="text-red-500 mt-2">{warning}</p>}
        </div>
  
        <div className="flex flex-grow">
                    {/* Map Section */}
                    <div className="flex-1 bg-gray-800 p-4 rounded-md shadow-md">
            <h2 className="text-xl font-semibold mb-2">Map Visualization</h2>
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={zoomLevel}
              style={{ height: "calc(100vh - 250px)", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {/* Display States */}
              <GeoJSON data={indiaGeoJson} style={indianBorder} />
  
              {currentGeoJson && (
                <GeoJSON
                  key={JSON.stringify(currentGeoJson)}
                  data={currentGeoJson}
                  onEachFeature={onEachFeature}
                />
              )}
              <ZoomHandler />
            </MapContainer>
          </div>
  
          {/* Plot Section */}
          <div className="flex-1 bg-gray-800 p-4 rounded-md shadow-md ml-4">
            <h2 className="text-lg font-bold mb-2">Plot Visualization</h2>
            <div id="plot" className="w-full h-96"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EdaDashboard;
