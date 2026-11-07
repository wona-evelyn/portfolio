import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
    const first = lines[0];
    const { author, date, time, timezone, datetime } = first;

    const result = {
      id: commit,
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
    };

    Object.defineProperty(result, 'lines', {
      value: lines,
      enumerable: false,
      writable: false,
      configurable: false,
    });

    return result;
  });
}

let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

function renderCommitInfo(data, commits) {
  const container = d3.select('#stats');
  container.selectAll('*').remove();

  const dl = container.append('dl').attr('class', 'stats');

  const stats = [
    ['Total lines of code', data.length],
    ['Total commits', commits.length],
    ['Number of files', d3.group(data, (d) => d.file).size],
    ['Longest line (characters)', d3.max(data, (d) => d.length) ?? 0],
    [
      'Average line length (characters)',
      (d3.mean(data, (d) => d.length) ?? 0).toFixed(1),
    ],
    ['Maximum indentation depth', d3.max(data, (d) => d.depth) ?? 0],
  ];

  for (const [label, value] of stats) {
    dl.append('dt').text(label);
    dl.append('dd').text(value);
  }
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');

  link.href = commit.url;
  link.textContent = commit.id;

  document.getElementById('commit-date').textContent =
    commit.datetime.toLocaleDateString('en', {
      dateStyle: 'full',
    });

  document.getElementById('commit-time').textContent =
    commit.datetime.toLocaleTimeString('en', {
      timeStyle: 'short',
    });

  document.getElementById('commit-author').textContent =
    commit.author;

  document.getElementById('commit-lines').textContent =
    commit.totalLines;
}


function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 20, right: 20, bottom: 45, left: 60 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const container = d3.select('#chart');
  container.selectAll('*').remove();

  const svg = container
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // Draw faint gridlines behind the dots.
  svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(
      d3.axisLeft(yScale)
        .ticks(12)
        .tickFormat('')
        .tickSize(-usableArea.width)
    );

  // Horizontal axis: dates.
  svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(d3.axisBottom(xScale).ticks(6));

  // Vertical axis: time of day.
  svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(
      d3.axisLeft(yScale)
        .ticks(12)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00')
    );

  const [minLines, maxLines] = d3.extent(
    commits,
    (d) => d.totalLines
  );

  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);


  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
        updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
    });
    createBrushSelector(svg, usableArea);

}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');

  tooltip.style.left = `${event.clientX + 12}px`;
  tooltip.style.top = `${event.clientY + 12}px`;
}

function createBrushSelector(svg, usableArea) {
  const brush = d3.brush().extent([
    [usableArea.left, usableArea.top],
    [usableArea.right, usableArea.bottom],
  ]);

  svg
    .append('g')
    .attr('class', 'brush')
    .call(brush);

  // Keep dots above the brush so hover tooltips still work.
  svg.select('.dots').raise();
}
