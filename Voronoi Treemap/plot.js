//Voronoi Treemap

// Constants
var _2PI = 2 * Math.PI;
      
// Layout Configuration
var svgWidth = 1600,
    svgHeight = 1100,
    margin = {top: 10, right: 10, bottom: 10, left: 10},
    height = svgHeight - margin.top - margin.bottom,
    width = svgWidth - margin.left - margin.right,
    halfWidth = width / 2,
    halfHeight = height / 2,
    titleY = 20,
    legendsMinY = svgHeight,
    legendsMinX = 250,
    treemapRadius = 500,
    treemapCenter = [halfWidth, halfHeight + 5];

// Treemap Configuration
var _voronoiTreemap = d3.voronoiTreemap();
var hierarchy, circlingPolygon;

// Drawing Configuration
var fontScale = d3.scaleLinear();

// D3 Selections
var svg, drawingArea, treemapContainer;

// Load JSON data
d3.json("vor_data.json").then(function(rootData) {
  initData();
  initLayout(rootData);
  hierarchy = d3.hierarchy(rootData).sum(function(d){ return d.weight; });
  _voronoiTreemap
    .clip(circlingPolygon)
    (hierarchy);
  
  drawTreemap(hierarchy);
});

function initData(rootData) {
  circlingPolygon = computeCirclingPolygon(treemapRadius);
  fontScale.domain([0, 40]).range([15, 40]).clamp(true);
}

function computeCirclingPolygon(radius) {
  var points = 60,
      increment = _2PI / points,
      circlingPolygon = [];
  
  for (var a = 0, i = 0; i < points; i++, a += increment) {
    circlingPolygon.push(
      [radius + radius * Math.cos(a), radius + radius * Math.sin(a)]
    );
  }
  
  return circlingPolygon;
}

function initLayout(rootData) {
  svg = d3.select("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
  
  drawingArea = svg.append("g")
    .classed("drawingArea", true)
    .attr("transform", "translate(" + [margin.left, margin.top] + ")");
  
  treemapContainer = drawingArea.append("g")
    .classed("treemap-container", true)
    .attr("transform", "translate(" + treemapCenter + ")");
  
  treemapContainer.append("path")
    .classed("world", true)
    .attr("transform", "translate(" + [-treemapRadius, -treemapRadius] + ")")
    .attr("d", "M" + circlingPolygon.join(",") + "Z");
  
  drawTitle();
  drawLegends(rootData);
}

function drawTitle() {
  drawingArea.append("text")
    .attr("id", "title")
    .attr("transform", "translate(" + [halfWidth, titleY] + ")")
    .attr("text-anchor", "middle")
    .text("Share of papers by country");
}

function drawLegends(rootData) {
  var legendHeight = 25,
      interLegend = 4,
      colorWidth = legendHeight * 6,
      continents = rootData.children.reverse().reverse();

  var legendContainer = drawingArea.append("g")
    .classed("legend", true)
    .attr("transform", "translate(" + [legendsMinX, legendsMinY] + ")");

  var legends = legendContainer.selectAll(".legend")
    .data(continents)
    .enter();

  var legend = legends.append("g")
    .classed("legend", true)
    .attr("transform", function (d, i) {
      return "translate(" + [i * (colorWidth + interLegend), 0] + ")";
    });

  legend.append("rect")
    .classed("legend-color", true)
    .attr("y", -legendHeight)
    .attr("width", colorWidth)
    .attr("height", legendHeight)
    .style("fill", function (d) { return d.color; });

  legend.append("text")
    .classed("tiny", true)
    .attr("transform", "translate(" + [colorWidth / 2, -legendHeight - 3] + ")")
    .attr("text-anchor", "middle")
    .style("font-size", legendHeight - 4)
    .style("font-weight", 700)
    .text(function (d) { return d.name; });
}

function drawTreemap(hierarchy) {
  var leaves = hierarchy.leaves();
  
  var cells = treemapContainer.append("g")
    .classed('cells', true)
    .attr("transform", "translate(" + [-treemapRadius, -treemapRadius] + ")")
    .selectAll(".cell")
    .data(leaves)
    .enter()
      .append("path")
      .classed("cell", true)
      .attr("d", function (d) { return "M" + d.polygon.join(",") + "z"; })
      .style("fill", function (d) {
        return d.parent.data.color;
      });

  var labels = treemapContainer.append("g")
    .classed('labels', true)
    .attr("transform", "translate(" + [-treemapRadius, -treemapRadius] + ")")
    .selectAll(".label")
    .data(leaves)
    .enter()
      .append("g")
      .classed("label", true)
      .attr("transform", function (d) {
        return "translate(" + [d.polygon.site.x, d.polygon.site.y] + ")";
      })
      .style("font-size", function (d) { return fontScale(d.data.weight ** 2); });
  
  labels.append("text")
    .classed("name", true)
    .html(function (d) {
      return (d.data.weight < 0.5) ? d.data.code : d.data.name;
    });
  labels.append("text")
    .classed("value", true)
    .text(function (d) { if (d.data.weight > 0.5) return d.data.weight + "%"; });

  var hoverers = treemapContainer.append("g")
    .classed('hoverers', true)
    .attr("transform", "translate(" + [-treemapRadius, -treemapRadius] + ")")
    .selectAll(".hoverer")
    .data(leaves)
    .enter()
      .append("path")
      .classed("hoverer", true)
      .attr("d", function (d) { return "M" + d.polygon.join(",") + "z"; });
  
  hoverers.append("title")
    .text(function (d) { return d.data.name + "\n" + d.value + "%"; });
}