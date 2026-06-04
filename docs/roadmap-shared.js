document.querySelectorAll('td.status').forEach((cell) => {
  const text = cell.textContent.trim();
  const value = text.toLowerCase();
  const badge = document.createElement('span');
  badge.className = 'status-badge';
  badge.textContent = text;
  if (value === 'сделано') {
    cell.classList.add('done');
    badge.classList.add('done');
  }
  if (value === 'запланировано') {
    cell.classList.add('plan');
    badge.classList.add('plan');
  }
  if (value === 'в работе') {
    cell.classList.add('progress');
    badge.classList.add('progress');
  }
  cell.textContent = '';
  cell.appendChild(badge);
});
