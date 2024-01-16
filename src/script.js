document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('form');

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
      .then((data) => console.log(data))
      .catch((error) => console.error('Error:', error));
  });
});
