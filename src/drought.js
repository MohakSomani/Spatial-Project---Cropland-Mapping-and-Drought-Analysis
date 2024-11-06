import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import geoJsonData from './custom.geo.json';

const DroughtVisualization = () => {
  const [selectedYear, setSelectedYear] = useState('2000');
  const [droughtData, setDroughtData] = useState([]);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  const years = Array.from({ length: 71 }, (_, i) => String(1950 + i)); // Adjust year range as needed

  useEffect(() => {
    d3.csv('./dataset/filtered_drought_data.csv').then((data) => {
      data.forEach((d) => {
        if (d['damages']) {
          d['damages'] = parseFloat(d['damages']);
        }
      });
      setDroughtData(data);
    }).catch(error => {
      console.error("Error loading drought CSV data:", error);
    });
  }, []);

  useEffect(() => {
    if (droughtData.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const projection = d3.geoMercator()
      .fitSize([width, height], geoJsonData)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const filteredData = droughtData.filter(row => row.Year === selectedYear);
    const maxDamage = d3.max(filteredData, d => +d['damages']);

    const colorScale = d3.scaleSequential(d3.interpolateGreens).domain([0, maxDamage || 1]);

    svg.attr("width", "100vw").attr("height", "100vh").style("background-color", "#c4fffc");

    svg.selectAll("path")
      .data(geoJsonData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => {
        const regionData = filteredData.find(row => row.Country === d.properties.name);
        return regionData ? colorScale(+regionData['damages']) : '#e0e0e0';
      })
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .style("transition", "fill 0.3s ease, transform 0.2s ease")
      .style("transform-origin", "center")
      .on("mouseover", function(event, d) {
        const regionData = filteredData.find(row => row.Country === d.properties.name);
        const tooltip = d3.select(tooltipRef.current);

        tooltip
          .style("display", "block")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`)
          .html(regionData
            ? `<strong>${d.properties.name}</strong><br>Damage: ${d3.format(".5f")(regionData['damages'])} (in millions)`
            : `<strong>${d.properties.name}</strong><br>No data available`);

        d3.select(this)
          .raise()  // Bring to top
          .transition()
          .duration(200)
          .attr("stroke", "#00f76f")
          .attr("stroke-width", 2)
          .style("transform", "scale(1.05)");  // Scale up
      })
      .on("mouseout", function() {
        d3.select(tooltipRef.current).style("display", "none");

        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke", "black")
          .attr("stroke-width", 0.5)
          .style("transform", "scale(1)");  // Reset scale
      });
  }, [droughtData, selectedYear]);

  return (
    <div className="w-full h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Drought Visualization</h2>
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
        </div>
      </div>
      <div className="relative">
        <svg ref={svgRef} className="w-full h-full" />
        <div ref={tooltipRef} className="tooltip" style={{ position: 'absolute', display: 'none', backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: '5px', borderRadius: '4px', pointerEvents: 'none' }} />
      </div>
    </div>
  );
};

export default DroughtVisualization;
