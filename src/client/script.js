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
      const data = await response.json(); // GameInfo[]
      updateUI(data);

      // TODO: handle loading state while crawler runs: https://css-loaders.com/arcade/ or /factory
      // TODO: persist data in local storage
    } catch (error) {
      console.error('Error: ', error);
    }
  });

  const updateUI = (data) => {
    tableBody.innerHTML = '';

    const populateTable = (game) => {
      const clone = document.importNode(rowTemplate.content, true);

      clone.querySelector('.title').textContent = game.key;
      // also wrap it an anchor link to this, item.url
      clone.querySelector('.epic').textContent = game?.epic?.price ?? '';
      clone.querySelector('.steam').textContent = game?.steam?.price ?? '';
      clone.querySelector('.gog').textContent = '';

      tableBody?.appendChild(clone);
    };

    data.forEach(populateTable);
  };
});
