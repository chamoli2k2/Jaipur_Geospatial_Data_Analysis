from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
import string
import re
import functools
import zipfile
import geopandas as gpd
import json
import plotly.express as px
import plotly.io as pio
from datetime import date

UPLOAD_FOLDER = 'media/uploads'
ALLOWED_EXTENSIONS = {'zip'}
STATIC_FOLDER = 'static'

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['STATIC_FOLDER'] = STATIC_FOLDER

from flask_cors import CORS
CORS(app)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def find_shp_file(directory):
    for filename in os.listdir(directory):
        if filename.endswith('.shp'):
            return os.path.join(directory, filename)
    return None


@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.config['STATIC_FOLDER'], filename)

@app.route('/generate_map', methods=['GET', 'POST'])
def generate_map():
    full_path = find_shp_file('media/uploads/extracted/images_1')
    if full_path is None:
        return 'No files uploaded yet'

    gdf = gpd.read_file(full_path)
    geojson_data = gdf.to_crs(epsg='4326').to_json()

    geojson_file_path = 'static/map_data.geojson'
    with open(geojson_file_path, 'w') as geojson_file:
        json.dump(json.loads(geojson_data), geojson_file)

    return 'GeoJSON data saved successfully'

# Updated time_series_plot function with additional debug statements
def time_series_plot(inp, gdf):
    exclude = string.punctuation
    print("time_series_plot called with inp:", inp)  # Debugging

    def remove_punc1(text):
        return text.translate(str.maketrans('', '', exclude))

    try:
        inp = remove_punc1(re.search("^(.+)(\d{2})$", inp).group(1)).lower()
    except AttributeError as e:
        print("Error processing input feature:", e)  # Debugging
        return None, None

    columns = gdf.columns
    print("Columns in GeoDataFrame:", columns)  # Debugging
    columns_after_regex = [re.search("^(.+)(\d{2})$", col) for col in columns]

    target_col_indices = []
    for i in range(len(columns_after_regex)):
        pattern = columns_after_regex[i]
        if pattern:
            key = remove_punc1(pattern.group(1)).lower()
            if key == inp:
                target_col_indices.append(i)

    curr_year = date.today().year % 100

    def compare_years(a, b):
        year_a = a[-2:]
        year_b = b[-2:]

        if int(year_a) <= curr_year:
            full_year_a = 2000 + int(year_a)
        else:
            full_year_a = 1900 + int(year_a)

        if int(year_b) <= curr_year:
            full_year_b = 2000 + int(year_b)
        else:
            full_year_b = 1900 + int(year_b)

        if full_year_a < full_year_b:
            return -1
        elif full_year_a > full_year_b:
            return 1
        else:
            return 0

    sorted_columns = sorted([columns[i] for i in target_col_indices], key=functools.cmp_to_key(compare_years))
    print("Sorted columns:", sorted_columns)  # Debugging

    years = [('19' + val[-2:]) if int(val[-2:]) > curr_year else ('20' + val[-2:]) for val in sorted_columns]
    rates = [gdf[val].mean() for val in sorted_columns]

    print("Years:", years)  # Debugging
    print("Rates:", rates)  # Debugging

    return years, rates

@app.route('/generate_plot', methods=['POST'])
def generate_plot():
    data = request.get_json()
    feature1 = data.get('feature1')
    feature2 = data.get('feature2')
    plot_type = data.get('plot_type')

    if not feature1 or not plot_type:
        return jsonify({"error": "feature1 and plot_type are required"}), 400

    full_path = find_shp_file('media/uploads/extracted/images_1')
    if full_path is None:
        return jsonify({"error": "No shapefile found"}), 400

    df = gpd.read_file(full_path)
    
    print("Received data:", data)  # Debugging
    print("Columns in DataFrame:", df.columns)  # Debugging

    try:
        if plot_type == 'time_series_plot':
            years, rates = time_series_plot(feature1, df)
            if years is None or rates is None:
                return jsonify({"error": "Failed to process time series data"}), 500
            print("Years for plot:", years)  # Debugging
            print("Rates for plot:", rates)  # Debugging
            fig = px.line(x=years, y=rates, labels={'x': 'Year', 'y': f'Mean {feature1}'}, title='Time Series Plot', markers=True)
            fig.update_layout(
                width=600,   # Set width of the plot
                height=400,  # Set height of the plot
                margin=dict(l=50, r=50, t=50, b=50)  # Adjust margins
            )
        elif plot_type == 'scatter':
            fig = px.scatter(df, x=feature1, y=feature2, title='Scatter Plot', trendline='ols')
        elif plot_type == 'line':
            fig = px.line(df, x=feature1, y=feature2, title='Line Plot')
        elif plot_type == 'box':
            fig = px.box(df, y=feature1, title='Box Plot')
        elif plot_type == 'pie':
            fig = px.pie(df, names=feature1, title='Pie Chart')
        elif plot_type == 'bar':
            fig = px.bar(df, x=feature1, y=feature2, title='Bar Plot')
        elif plot_type == 'proportional_scatter':
            fig = px.scatter(df, x=feature1, y=feature2, size=feature1, title='Proportional Scatter Plot')
        elif plot_type == 'categorical_scatter':
            fig = px.scatter(df, x=feature1, y=feature2, color=feature1, title='Categorical Scatter Plot')
        elif plot_type == 'density':
            fig = px.density_contour(df, x=feature1, y=feature2, title='Density Plot')

        plot_json = fig.to_json()
        plot_json_path = "static/plot_output.json"
        with open(plot_json_path, 'w') as file:
            json.dump(plot_json, file)

        return jsonify({"plot_json_path": plot_json_path})

    except Exception as e:
        print("Error during plot generation:", e)  # Debugging
        return jsonify({"error": str(e)}), 500

def summarize_geospatial_dataset(gdf):
    num_features = len(gdf)
    num_attributes = len(gdf.columns)
    geometry_type = gdf.geom_type.unique()[0]
    crs = gdf.crs

    geometry_stats = {
        'geometry_type': geometry_type,
        'crs': str(crs),
        'extent': gdf.total_bounds.tolist(),
        'area': gdf.area.sum(),
        'length': gdf.length.sum()
    }

    summary = {
        'num_features': num_features,
        'num_attributes': num_attributes,
        'geometry_stats': geometry_stats
    }

    return summary

@app.route('/summary', methods=['GET'])
def summary():
    full_path = find_shp_file('media/uploads/extracted/images_1')
    if full_path is None:
        return jsonify({"error": "No shapefile found"}), 400

    gdf = gpd.read_file(full_path)
    summary_data = summarize_geospatial_dataset(gdf)

    summary_json_path = os.path.join(app.config['STATIC_FOLDER'], 'summary.json')
    with open(summary_json_path, 'w') as summary_file:
        json.dump(summary_data, summary_file)

    return jsonify(summary_data)

if __name__ == '__main__':
    app.run(debug=True)
