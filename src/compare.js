import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import geoJsonData from './custom.geo.json';

const InteractiveCropDroughtChart = () => {
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [cropData, setCropData] = useState([]);
  const [droughtData, setDroughtData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const mapSvgRef = useRef(null);
  const chartSvgRef = useRef(null);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);

  const crops = ['Bananas', 'Cocoa beans', 'Coffee, green', 'Maize (corn)', 'Olives', 'Potatoes', 'Rice', 'Soya beans', 'Wheat'];

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      createWorldMap(geoJsonData, []);

      const [cropDataResponse, droughtDataResponse] = await Promise.all([
        d3.csv('/dataset/data_yy.csv'),
        d3.csv('/dataset/filtered_drought_data.csv')
      ]);

      const processedCropData = cropDataResponse.map(d => ({
        ...d,
        Value: d.Value ? parseFloat(d.Value.replace(/%/g, "").replace(/,/g, "")) : 0,
        Year: parseInt(d.Year)
      }));
      setCropData(processedCropData);

      const processedDroughtData = droughtDataResponse.map(d => ({
        ...d,
        damages: d.damages ? parseFloat(d.damages) : 0,
        Year: parseInt(d.Year)
      }));
      setDroughtData(processedDroughtData);

      createWorldMap(geoJsonData, processedCropData);
      updateLineChart('India', processedCropData, processedDroughtData);

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createWorldMap = useCallback((geoJsonData, data) => {
    if (!mapSvgRef.current) return;

    const width = 500;
    const height = 400;

    d3.select(mapSvgRef.current).selectAll("*").remove();

    const svg = d3.select(mapSvgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background-color", "#f0f8ff");

    const projection = d3.geoMercator()
      .scale(85)
      .center([0, 20])
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const countriesWithData = new Set(data.map(d => d.Country));

    svg.selectAll("path")
      .data(geoJsonData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => {
        return d.properties.name === selectedCountry ? "#69b3d6" :
               countriesWithData.has(d.properties.name) ? "#a8d5e5" : "#d3d3d3";
      })
      .attr("stroke", "#666")
      .attr("stroke-width", d => d.properties.name === selectedCountry ? 2 : 1)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        setSelectedCountry(d.properties.name);
      });
  }, [selectedCountry]);

  useEffect(() => {
    if (geoJsonData && cropData) {
      createWorldMap(geoJsonData, cropData);
    }
  }, [createWorldMap, cropData, selectedCountry]);

  const updateLineChart = useCallback((country, currentCropData = cropData, currentDroughtData = droughtData) => {
    if (!country || !currentCropData.length || !currentDroughtData.length) return;

    d3.select(chartSvgRef.current).selectAll("*").remove();

    const width = 500;
    const height = 400;
    const margin = { top: 20, right: 60, bottom: 40, left: 50 };

    const svg = d3.select(chartSvgRef.current)
      .attr("width", width)
      .attr("height", height);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const chart = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const filteredCropData = currentCropData
      .filter(d => d.Item === selectedCrop && 
                  d.Area === country &&
                  d.Year >= 2000 && d.Year <= 2020)
      .sort((a, b) => a.Year - b.Year);

    const filteredDroughtData = currentDroughtData
      .filter(d => d.Country === country &&
                  d.Year >= 2000 && d.Year <= 2020)
      .sort((a, b) => a.Year - b.Year);

    if (filteredCropData.length === 0 && filteredDroughtData.length === 0) {
      chart.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight / 2)
        .attr("text-anchor", "middle")
        .text("No data available for selected country");
      return;
    }

    const xScale = d3.scaleLinear()
      .domain([2000, 2020])
      .range([0, innerWidth]);

    const yScaleCrop = d3.scaleLinear()
      .domain([0, d3.max(filteredCropData, d => d.Value) * 1.1])
      .range([innerHeight, 0]);

    const yScaleDrought = d3.scaleLinear()
      .domain([0, d3.max(filteredDroughtData, d => d.damages) * 1.1])
      .range([innerHeight, 0]);

    const cropLine = d3.line()
      .defined(d => !isNaN(d.Value) && d.Value !== null)
      .x(d => xScale(d.Year))
      .y(d => yScaleCrop(d.Value));

    const droughtLine = d3.line()
      .defined(d => !isNaN(d.damages) && d.damages !== null)
      .x(d => xScale(d.Year))
      .y(d => yScaleDrought(d.damages));

    chart.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    const formatValue = (value) => {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toFixed(1);
    };

    chart.append("g")
      .call(d3.axisLeft(yScaleCrop).tickFormat(formatValue));

    chart.append("g")
      .attr("transform", `translate(${innerWidth}, 0)`)
      .call(d3.axisRight(yScaleDrought).tickFormat(formatValue));

    if (filteredCropData.length > 0) {
      chart.append("path")
        .datum(filteredCropData)
        .attr("fill", "none")
        .attr("stroke", "#2563eb")
        .attr("stroke-width", 2)
        .attr("d", cropLine);
    }

    if (filteredDroughtData.length > 0) {
      chart.append("path")
        .datum(filteredDroughtData)
        .attr("fill", "none")
        .attr("stroke", "#dc2626")
        .attr("stroke-width", 2)
        .attr("d", droughtLine);
    }

    chart.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 35)
      .attr("text-anchor", "middle")
      .text("Year");

    chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .text(`${selectedCrop} Production`);

    chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", innerWidth + 40)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .text("Drought Damage");
  }, [cropData, droughtData, selectedCrop]);

  useEffect(() => {
    if (selectedCountry && !isLoading) {
      updateLineChart(selectedCountry);
    }
  }, [selectedCrop, selectedCountry, updateLineChart, isLoading]);

  return (
    <div ref={containerRef} className="w-full p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Crop and Drought Visualization</h2>
        <select
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {crops.map(crop => (
            <option key={crop} value={crop}>{crop}</option>
          ))}
        </select>
      </div>
      <div className="flex">
        <svg ref={mapSvgRef} className="flex-1"></svg>
        <svg ref={chartSvgRef} className="flex-1"></svg>
      </div>
      <div ref={tooltipRef} className="tooltip absolute bg-gray-100 shadow-md p-2 text-xs rounded hidden"></div>
    </div>
  );
};

export default InteractiveCropDroughtChart;
