import '@babel/polyfill';
import { displayMap } from './mapbox';
import { fetchRequest } from './utils/fetchRequest';
import { fetchLogin } from './utils/fetchRequest';
import { openDateModal } from './modal';

// DOM ELEMENTS
const mapBox = document.querySelector('#map');
const loginForm = document.querySelector('#login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('#update-data');
const passwordUpdateForm = document.querySelector('#update-password');
const bookBtn = document.querySelector('#book-tour');
const modalDate = document.querySelector('#modal-date');
const cancelModalDate = document.querySelector('#modal-date-cancel');

const resendEmail = document.querySelector('#resend-email');

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
    fetchLogin(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    const response = await fetchRequest({
      method: 'GET',
      url: 'users/logout',
    });
    if (response) {
      location.assign('/');
    }
  });
}

if (updateDataForm) {
  updateDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;
    const photo = document.querySelector('#photo').files[0];
    const form = new FormData();
    form.append('name', name);
    form.append('email', email);
    form.append('photo', photo);
    fetchRequest({
      body: form,
      method: 'PATCH',
      url: 'users/updateMe',
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
      url: 'users/updateMyPassword',
      messageOnSuccess: 'Password successfully updated',
    });
    passwordCurrent.value = '';
    password.value = '';
    passwordConfirm.value = '';
    btnSave.blur();
    btnSave.textContent = 'Save Password';
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', async (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    await openDateModal(tourId);
    e.target.textContent = 'See available dates';
  });
}

if (cancelModalDate) {
  cancelModalDate.addEventListener('click', () => {
    modalDate.style.display = 'none';
  });

  modalDate.addEventListener('click', (event) => {
    if (event.target.id !== 'modal-date') return;
    modalDate.style.display = 'none';
  });
}

if (resendEmail) {
  resendEmail.addEventListener('click', () => {
    fetchRequest({
      url: 'users/resendEmail',
      method: 'POST',
      messageOnSuccess: 'Email resent, check your inbox',
    });
  });
}
