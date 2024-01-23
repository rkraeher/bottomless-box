document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('form');
  const results = document.getElementById('results');

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const input = document.querySelector('input[name="q"]');
    const inputValue = input.value;
    const searchUrl = `/search?steamId=${encodeURIComponent(inputValue)}`;

    fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('data.items', data.items);
        results.innerHTML = data.items[4].name;
      })
      .catch((error) => console.error('Error:', error));
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const data = [
    {
      title: 'Cyberpunk 2077',
      steam: '$59.99',
      epic: '$59.99',
      gog: '$59.99',
    },
    {
      title: 'The Witcher 3: Wild Hunt',
      steam: '$39.99',
      epic: '$39.99',
      gog: '$39.99',
    },
    {
      title: 'Red Dead Redemption 2',
      steam: '$59.99',
      epic: '$59.99',
      gog: '$59.99',
    },
  ];

  const rowTemplate = document.getElementById('rowTemplate');
  const tableBody = document.getElementById('tableBody');

  const populateTable = (rowData) => {
    const clone = document.importNode(rowTemplate.content, true);

    // TODO Replace with actual data
    clone.querySelector('.title').textContent = rowData.title;
    clone.querySelector('.steam').textContent = rowData.steam;
    clone.querySelector('.epic').textContent = rowData.epic;
    clone.querySelector('.gog').textContent = rowData.gog;

    tableBody.appendChild(clone);
  };

  data.forEach(populateTable);
});
