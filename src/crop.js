import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import geoJsonData from './custom.geo.json';

const CropVisualization = () => {
  const [selectedYear, setSelectedYear] = useState('2000');
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [cropData, setCropData] = useState([]);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  const years = Array.from({ length: 21 }, (_, i) => String(2000 + i));
  const crops = ['Bananas', 'Cocoa beans', 'Coffee, green', 'Maize (corn)', 'Olives', 'Potatoes', 'Rice', 'Soya beans', 'Wheat'];
  const unit = 'kg/ha';

  useEffect(() => {
    d3.csv('./dataset/data_yy.csv').then((data) => {
      data.forEach((d) => {
        if (d.Value) {
          d.Value = parseFloat(d.Value.replace(/%/g, "").replace(/,/g, ""));
        }
      });
      setCropData(data);
    }).catch(error => {
      console.error("Error loading CSV data:", error);
    });
  }, []);

  useEffect(() => {
    if (cropData.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const projection = d3.geoMercator()
      .fitSize([width, height], geoJsonData)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const filteredData = cropData.filter(row => row.Year === selectedYear && row.Item === selectedCrop);
    const maxVal = d3.max(filteredData, d => +d.Value);

    const colorScale = d3.scaleSequential(d3.interpolateGreens).domain([0, maxVal || 1]);

    svg.attr("width", "100vw").attr("height", "100vh").style("background-color", "#c4fffc");

    svg.selectAll("path")
      .data(geoJsonData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => {
        const regionData = filteredData.find(row => row.Area === d.properties.name);
        return regionData ? colorScale(+regionData.Value) : '#e0e0e0';
      })
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .style("transition", "fill 0.3s ease, transform 0.2s ease")
      .style("transform-origin", "center")
      .on("mouseover", function(event, d) {
        const regionData = filteredData.find(row => row.Area === d.properties.name);
        const tooltip = d3.select(tooltipRef.current);

        tooltip
          .style("display", "block")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`)
          .html(regionData
            ? `<strong>${d.properties.name}</strong><br>${selectedCrop}: ${regionData.Value} ${unit}`
            : `<strong>${d.properties.name}</strong><br>No data available`);

        d3.select(this)
          .raise()  // Move this path to the top
          .transition()
          .duration(200)
          .attr("stroke", "#f70008")
          .attr("stroke-width", 2)
          .style("transform", "scale(1.05)");  // Scale up in place
      })
      .on("mouseout", function() {
        d3.select(tooltipRef.current).style("display", "none");

        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke", "black")
          .attr("stroke-width", 0.5)
          .style("transform", "scale(1)");  // Reset to original scale
      });
  }, [cropData, selectedYear, selectedCrop]);

  return (
    <div className="w-full h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Crop Visualization</h2>
        <div className="flex gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            {crops.map((crop) => (
              <option key={crop} value={crop}>
                {crop}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="relative">
        <svg ref={svgRef} className="w-full h-full" />
        <div ref={tooltipRef} className="tooltip" style={{ position: 'absolute', display: 'none', backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: '5px', borderRadius: '4px', pointerEvents: 'none' }} />
      </div>
    </div>
  );
};

export default CropVisualization;
