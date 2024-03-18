import { scaleLinear } from "d3-scale"; // Add this
import { lineRadial } from "d3-shape"; // Add this
import { line } from "d3";
import { select } from "d3";
import { JSDOM } from "jsdom";

function drawConcentricPentagrams(
  svg,
  data,
  radiusScale,
  angleSlice,
  levels,
  levelStep
) {
  for (let l = levels; l >= 1; l--) {
    // Start from largest pentagram
    const currentRadius = radiusScale(levelStep * l);

    const points = data.map((d, i) => [
      currentRadius * Math.sin(angleSlice * i),
      -currentRadius * Math.cos(angleSlice * i),
    ]);

    points.push(points[0]); // Close the path

    svg
      .append("path")
      .datum(points)
      .attr("d", line())
      .style("stroke", "#678a9f")
      .style("fill", getFillColor(l));
  }
}
function getFillColor(level) {
  // Define the colors for your concentric pentagrams here
  // This is just an example; adjust it to your desired colors
  const colors = ["#0f333e", "#1f4359", "#335974", "#446c8f", "#697ba5"];
  return colors[level - 1];
}

export function renderRadarChart(data, isBig) {
  
  const order = [
    'Psychological Safety',
    'Equal Participation',
    'Enjoyment',
    'Shared Goal Commitment',
    'Absorption or Task Engagement',
    'Trust'
  ];
  const sortedData = data.sort((a, b) => order.indexOf(a.k) - order.indexOf(b.k));
  
  const width = 350; // Adjust this as per your desired width
  const height = 250; // Adjust this as per your desired height

  const dom = new JSDOM(
    `<!DOCTYPE html><svg width="${width}" height="${height}"></svg>`
  );

  const centerX = width / 2;
  const centerY = height / 2;

  const svg = select(dom.window.document.querySelector("svg"))
    .append("g")
    .attr("transform", `translate(${centerX}, ${centerY})`);

  const radius = Math.min(width, height) / 2 - 40; // -20 or a similar value to give some padding
  const n = sortedData.length; // number of axes
  const angleSlice = (2 * Math.PI) / n; // Calculate the angle for each slice
  const levels = 5;
  const levelStep = 1 / levels; // step value for each level

  const radiusScale = scaleLinear()
    .domain([0, 1]) // Assuming max value of 1
    .range([0, radius]);

  drawConcentricPentagrams(
    svg,
    sortedData,
    radiusScale,
    angleSlice,
    levels,
    levelStep
  );

  for (let i = 0; i < n; i++) {
    const angle = angleSlice * i;

    svg
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", radius * Math.sin(angle))
      .attr("y2", -radius * Math.cos(angle))
      .style("stroke", "#787F8F");
  }

  const lineGenerator = lineRadial()
    .radius((d) => radiusScale(d.v))
    .angle((d, i) => angleSlice * i);

  const lineData = [...sortedData.map((d) => ({ v: d.v })), { v: data[0].v }]; // Add the first data point at the end

  svg
    .append("path")
    .attr("d", lineGenerator(lineData))
    .attr("fill", isBig ? "rgba(118, 253, 63, 0.1)" : "rgba(0, 209, 255, 0.1)")
    .attr("stroke", isBig ? "rgba(118, 253, 63, 0.8)" : "#8ED7FF")
    .attr("stroke-width", 2);
  // add a dot for each data point
  svg
    .selectAll("circle")
    .data(sortedData)
    .enter()
    .append("circle")
    .attr("cx", (d, i) => radiusScale(d.v) * Math.sin(angleSlice * i))
    .attr("cy", (d, i) => -radiusScale(d.v) * Math.cos(angleSlice * i))
    .attr("r", 5)
    .attr("fill", isBig ? "rgba(118, 253, 63, 0.8)" : "#8ED7FF");

  const labels = [
    "Safety",
    "Participation",
    "Enjoyment",
    "Shared goal",
    "Engagement",
    "Trust",
  ];
  const labelOffset = 15; // Adjust this value based on how far out you want the labels to be

  svg
    .selectAll(".label")
    .data(labels)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d, i) => {
      if (i === 0) return 0; // Center the "Trust" label
      return (radius + labelOffset) * Math.sin(angleSlice * i);
    })
    .attr("y", (d, i) => -(radius + labelOffset) * Math.cos(angleSlice * i))
    .style("text-anchor", (d, i) => {
      if (i === 0) return "middle"; // Adjust the anchor for the "Trust" label
      else if (angleSlice * i < Math.PI) return "start";
      else return "end";
    })
    .style("alignment-baseline", (d, i) => {
      if (angleSlice * i < Math.PI) return "middle";
      else return "middle";
    })
    .style("text-rendering", "optimizeLegibility")
    .text((d) => d);

  svg.selectAll(".label").style("fill", "white");

  return dom.window.document.querySelector("svg").outerHTML;
}
