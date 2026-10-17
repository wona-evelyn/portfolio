console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Use the correct base path locally and on GitHub Pages.
const BASE_PATH =
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1'
    ? '/'
    : '/portfolio/';

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
