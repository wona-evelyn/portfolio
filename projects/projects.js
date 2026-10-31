import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `Projects (${projects.length})`;

// Group projects by year and count each group.
function renderPieChart(projectsGiven) {
  const rolledData = d3.rollups(
    projectsGiven,
    (group) => group.length,
    (project) => project.year,
  );

  const data = rolledData.map(([year, count]) => ({
    value: count,
    label: String(year),
  }));

  const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);
  const arcs = arcData.map((slice) => arcGenerator(slice));

  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  const svg = d3.select('#projects-plot');
  const legend = d3.select('.legend');

  // Remove the previous chart and legend before redrawing.
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  arcs.forEach((arc, index) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(index));
  });

  data.forEach((item, index) => {
    legend.append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color: ${colors(index)}`)
      .html(`
        <span class="swatch"></span>
        ${item.label} <em>(${item.value})</em>
      `);
  });
}

// Draw the chart when the page first loads.
renderPieChart(projects);


let query = '';

const searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  const filteredProjects = projects.filter((project) => {
    const values = Object.values(project)
      .join('\n')
      .toLowerCase();

    return values.includes(query.toLowerCase());
  });

  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);

  projectsTitle.textContent =
    `Projects (${filteredProjects.length})`;
});
