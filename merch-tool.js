document.getElementById('merch-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const budget = parseInt(document.getElementById('budget').value);
  const profitMargin = parseFloat(document.getElementById('profit-margin').value) / 100;

  try {
    // Fetch a sample of items from the Grand Exchange API
    const response = await fetch('https://services.runescape.com/m=itemdb_oldschool/api/catalogue/items.json?category=1&alpha=a&page=1');
    const data = await response.json();

    const items = data.items
      .filter(item => {
        const buyPrice = parseInt(item.current.price.toString().replace(/,/g, ''));
        const sellPrice = buyPrice * (1 + profitMargin);
        return buyPrice <= budget && sellPrice - buyPrice > 0;
      })
      .slice(0, 5); // Limit to top 5 for simplicity

    const resultsBody = document.getElementById('results-body');
    resultsBody.innerHTML = '';
    items.forEach(item => {
      const buyPrice = parseInt(item.current.price.toString().replace(/,/g, ''));
      const sellPrice = (buyPrice * (1 + profitMargin)).toFixed(0);
      const profit = (sellPrice - buyPrice).toFixed(0);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${buyPrice.toLocaleString()}</td>
        <td>${sellPrice.toLocaleString()}</td>
        <td>${profit.toLocaleString()}</td>
        <td>${item.day180.trend}</td>
      `;
      resultsBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error fetching GE data:', error);
    resultsBody.innerHTML = '<tr><td colspan="5">Unable to fetch data. Try again later.</td></tr>';
  }
});
