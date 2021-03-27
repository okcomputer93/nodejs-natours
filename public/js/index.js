import '@babel/polyfill';
import { displayMap } from './mapbox';
import { fetchRequest } from './utils/fetchRequest';

// DOM ELEMENTS
const mapBox = document.querySelector('#map');
const loginForm = document.querySelector('#login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateForm = document.querySelector('#update-data');

// VALUES

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    const response = await fetchRequest({
      body: {
        email,
        password,
      },
      method: 'POST',
      url: 'login',
      messageOnSuccess: 'Logged in successfully',
    });

    if (response) {
      setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    const response = await fetchRequest({
      method: 'GET',
      url: 'logout',
    });
    if (response) {
      location.reload();
    }
  });
}

if (updateForm) {
  updateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;
    fetchRequest({
      body: {
        name,
        email,
      },
      method: 'PATCH',
      url: 'updateMe',
      messageOnSuccess: 'Data successfully updated',
    });
  });
}
