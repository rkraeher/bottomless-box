document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const tableBody = document.getElementById('tableBody');
  const rowTemplate = document.getElementById('rowTemplate');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const input = document.querySelector('input[name="q"]');
    const inputValue = input.value;
    const searchEndpoint = `/search?steamId=${encodeURIComponent(inputValue)}`;

    try {
      const response = await fetch(searchEndpoint);
      const data = await response.json();
      updateUI(data.items);
    } catch (error) {
      console.error('Error: ', error);
    }
  });

  const updateUI = (data) => {
    tableBody.innerHTML = '';

    const populateTable = (item) => {
      const clone = document.importNode(rowTemplate.content, true);

      clone.querySelector('.title').textContent = item.name;
      // also wrap it an anchor link to this, item.url
      clone.querySelector('.epic').textContent = item.price;
      clone.querySelector('.steam').textContent = '';
      clone.querySelector('.gog').textContent = '';

      tableBody?.appendChild(clone);
    };

    data.forEach(populateTable);
  };
});
