console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Use the correct base path locally and on GitHub Pages.
const BASE_PATH = new URL('.', import.meta.url).pathname;

// List the pages in the navigation.
let pages = [
  { url: 'index.html', title: 'Home' },
  { url: 'projects/index.html', title: 'Projects' },
  { url: 'contact/index.html', title: 'Contact' },
  { url: 'resume/index.html', title: 'Resume' },
  { url: 'https://github.com/wona-evelyn', title: 'GitHub' },
];

// Create the navigation once.
let nav = document.createElement('nav');
document.body.prepend(nav);

// Create and add each navigation link.
for (let p of pages) {
  let url = p.url;

  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }

  let a = document.createElement('a');
  a.href = url;
  a.textContent = p.title;

  // Treat "/" and "/index.html" as the same page.
  let linkPath = a.pathname.replace(/index\.html$/, '');
  let currentPath = location.pathname.replace(/index\.html$/, '');

  // Highlight the current page.
  if (a.host === location.host && linkPath === currentPath) {
    a.classList.add('current');
  }

  // Open external links in a new tab.
  if (a.host !== location.host) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }

  nav.append(a);
}

// Add the theme dropdown.
document.body.insertAdjacentHTML(
  'afterbegin',
  `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  `
);

// Find the theme dropdown.
// Find the theme dropdown.
let select = document.querySelector('.color-scheme select');

// Update both the page theme and the dropdown.
function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty(
    'color-scheme',
    colorScheme
  );

  select.value = colorScheme;
}

// Restore the saved preference when the page loads.
let savedColorScheme =
  localStorage.getItem('colorScheme') || 'light dark';

setColorScheme(savedColorScheme);

// Apply and save the user's new selection.
select.addEventListener('input', function (event) {
  let colorScheme = event.target.value;

  setColorScheme(colorScheme);
  localStorage.setItem('colorScheme', colorScheme);
});

// Improve the contact form.
let form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
  // Stop the browser's default form submission.
  event.preventDefault();

  // Read the form fields.
  let data = new FormData(form);
  let params = [];

  // Encode spaces and special characters correctly.
  for (let [name, value] of data) {
    params.push(
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
    );
  }

  // Build the mailto URL and open the email app.
  let url = `${form.action}?${params.join('&')}`;
    console.log('Opening email:', url);
    location.href = url;
});

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    throw error;
  }
}

export function renderProjects(
  projects,
  containerElement,
  headingLevel = 'h2'
) {
  containerElement.innerHTML = '';

  for (const project of projects) {
    const article = document.createElement('article');

    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <div class="project-details">
      <p>${project.description}</p>
      <p class="project-year">Year: ${project.year}</p>
      </div>
    `;


    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
