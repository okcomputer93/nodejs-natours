import '@babel/polyfill';
import { displayMap } from './mapbox';
import { fetchRequest } from './utils/fetchRequest';

// DOM ELEMENTS
const mapBox = document.querySelector('#map');
const loginForm = document.querySelector('#login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('#update-data');
const passwordUpdateForm = document.querySelector('#update-password');

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

if (updateDataForm) {
  updateDataForm.addEventListener('submit', (e) => {
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

if (passwordUpdateForm) {
  passwordUpdateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSave = document.querySelector('.btn--save-password');
    btnSave.textContent = 'Updating...';
    const passwordCurrent = document.querySelector('#password-current');
    const password = document.querySelector('#password');
    const passwordConfirm = document.querySelector('#password-confirm');

    await fetchRequest({
      body: {
        passwordCurrent: passwordCurrent.value,
        password: password.value,
        passwordConfirm: passwordConfirm.value,
      },
      method: 'PATCH',
      url: 'updateMyPassword',
      messageOnSuccess: 'Password successfully updated',
    });
    passwordCurrent.value = '';
    password.value = '';
    passwordConfirm.value = '';
    btnSave.blur();
    btnSave.textContent = 'Save Password';
  });
}
