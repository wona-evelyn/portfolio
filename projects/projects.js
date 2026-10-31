import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let query = '';
let selectedYear = null;

// Keep each year's color consistent, even after searching.
const colors = d3.scaleOrdinal(d3.schemeTableau10)
  .domain([...new Set(projects.map((p) => String(p.year)))]);

const arcGenerator = d3.arc()
  .innerRadius(0)
  .outerRadius(50);

// Apply the search filter.
function getSearchMatches() {
  const normalizedQuery = query.toLowerCase();

  return projects.filter((project) => {
    const values = Object.values(project)
      .join('\n')
      .toLowerCase();

    return values.includes(normalizedQuery);
  });
}

// Apply the year filter to the search results, not all projects.
function renderVisibleProjects(searchMatches) {
  const visibleProjects = selectedYear === null
    ? searchMatches
    : searchMatches.filter((project) =>
        String(project.year) === selectedYear
      );

  renderProjects(visibleProjects, projectsContainer, 'h2');

  projectsTitle.textContent =
    `Projects (${visibleProjects.length})`;
}

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

  const sliceGenerator = d3.pie()
    .value((d) => d.value)
    .sort(null);

  const arcs = sliceGenerator(data)
    .map((slice) => arcGenerator(slice));

  const svg = d3.select('#projects-plot');
  const legend = d3.select('.legend');

  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  function updateHighlights() {
    svg.selectAll('path')
      .classed('selected', (_, i) =>
        data[i].label === selectedYear
      )
      .attr('aria-pressed', (_, i) =>
        data[i].label === selectedYear
      );

    legend.selectAll('li')
      .classed('selected', (_, i) =>
        data[i].label === selectedYear
      )
      .attr('aria-pressed', (_, i) =>
        data[i].label === selectedYear
      );
  }

  function toggleSelection(index) {
    const year = data[index].label;

    selectedYear = selectedYear === year ? null : year;

    updateHighlights();
    renderVisibleProjects(getSearchMatches());
  }

  function handleSelectionKey(event, index) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleSelection(index);
    }
  }

  arcs.forEach((arc, index) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(data[index].label))
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', `Select year ${data[index].label}`)
      .on('click', () => toggleSelection(index))
      .on('keydown', (event) =>
        handleSelectionKey(event, index)
      );
  });

  data.forEach((item, index) => {
    legend.append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color: ${colors(item.label)}`)
      .attr('role', 'button')
      .attr('tabindex', 0)
      .html(`
        <span class="swatch"></span>
        ${item.label} <em>(${item.value})</em>
      `)
      .on('click', () => toggleSelection(index))
      .on('keydown', (event) =>
        handleSelectionKey(event, index)
      );
  });

  updateHighlights();
}

function updateView() {
  const searchMatches = getSearchMatches();

  renderVisibleProjects(searchMatches);

  // Keep all search-matching years available in the chart.
  renderPieChart(searchMatches);
}

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  updateView();
});

// Initial page render.
updateView();
