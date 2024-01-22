import { Dictionary } from 'crawlee';

interface RowTemplate extends HTMLTemplateElement {
  readonly content: DocumentFragment;
}

export const updateUI = (data: Dictionary) => {
  const rowTemplate = window.document.getElementById(
    'rowTemplate'
  ) as RowTemplate;
  const tableBody = window.document.getElementById('tableBody');

  const populateTable = (rowData: Dictionary) => {
    const clone = window.document.importNode(rowTemplate.content, true);

    const selectors = {
      title: clone.querySelector('.title'),
      steam: clone.querySelector('.steam'),
      epic: clone.querySelector('epic'),
      gog: clone.querySelector('gog'),
    };

    if (selectors.title && selectors.steam && selectors.epic && selectors.gog) {
      selectors.title.textContent = rowData.title;
      selectors.steam.textContent = rowData.steam;
      selectors.epic.textContent = rowData.epic;
      selectors.gog.textContent = rowData.gog;

      tableBody?.appendChild(clone);
    }
  };

  data.forEach(populateTable);
};
