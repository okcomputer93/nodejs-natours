import '@babel/polyfill';
import { displayMap } from './mapbox';
import { fetchRequest } from './utils/fetchRequest';
import { bookTour } from './stripe';
import { showAlert } from './alerts';

// DOM ELEMENTS
const mapBox = document.querySelector('#map');
const loginForm = document.querySelector('#login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('#update-data');
const passwordUpdateForm = document.querySelector('#update-password');
const bookBtn = document.querySelector('#book-tour');
const formDate = document.querySelector('#form-date');
const modalDate = document.querySelector('#modal-date');
const modalDateText = document.querySelector('#modal-date-text');
const bookModalDate = document.querySelector('#modal-date-book');
const cancelModalDate = document.querySelector('#modal-date-cancel');
const dateOptions = document.querySelector('#dates');

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
      url: 'users/login',
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
      url: 'users/logout',
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

const openDateModal = async (tourId) => {
  dateOptions.disabled = false;
  bookModalDate.disabled = false;
  modalDateText.textContent = 'Just one more step...';
  modalDate.style.display = 'block';
  dateOptions.innerHTML = `
    <option class="select__option" value="">Please select a booking date</option>
  `;
  const tour = await fetchRequest({
    method: 'GET',
    url: `tours/${tourId}`,
    returnData: true,
  });
  if (!tour) {
    return showAlert('error', 'Sorry this tour is not available');
  }
  const { startDates, participants, maxPerDay } = tour.data.data;
  const leftParticipants = maxPerDay.map((el, index) => {
    const left = el - participants[index];
    if (left <= 0) return 0;
    return left;
  });
  console.log(leftParticipants, 'left');
  if (startDates.length <= 0 || leftParticipants.every((curr) => curr <= 0)) {
    showAlert('error', 'All dates on this tour are booked out!');
    dateOptions.disabled = true;
    bookModalDate.disabled = true;
    modalDateText.textContent = 'Sorry, this tour is booked out';
    return;
  }
  const datesMarkup = startDates.map((date, index) => {
    if (leftParticipants[index] <= 0) return;
    const printableDate = new Date(date).toLocaleString('en-us', {
      weekday: 'long', // long, short, narrow
      day: 'numeric', // numeric, 2-digit
      year: 'numeric', // numeric, 2-digit
      month: 'short', // numeric, 2-digit, long, short, narrow
      hour: 'numeric', // numeric, 2-digit
      minute: 'numeric', // numeric, 2-digit
      second: 'numeric', // numeric, 2-digit
    });
    return `
      <option class="select__option" value="${date}">${printableDate}</option>
    `;
  });
  dateOptions.insertAdjacentHTML('beforeend', datesMarkup);
  createBookListener(tourId);
};

const createBookListener = (tourId) => {
  formDate.addEventListener('submit', (event) => {
    event.preventDefault();
    const dateValue = event.target.querySelector('#dates').value;
    console.log(dateValue);
    if (!dateValue) console.error('Please select a date');
    bookTour(tourId, dateValue);
  });
};

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
}

//TODO: Refactor all this mess!!
