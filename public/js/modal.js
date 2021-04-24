import { bookTour } from './stripe';
import { showAlert } from './alerts';
import { fetchRequest } from './utils/fetchRequest';
import { fetchAndStream } from './utils/fetchRequest';

//* DateModal DOM Elements
const formDate = document.querySelector('#form-date');
const modalDateText = document.querySelector('#modal-date-text');
const bookModalDate = document.querySelector('#modal-date-book');
const dateOptions = document.querySelector('#dates');
const modalDate = document.querySelector('#modal-date');
const closeModal = document.querySelector('.modal__close');

//* PasswordModal DOM Elements
const modalPassword = document.querySelector('#modal-password');
// const formPassword = document.querySelector('#form-password');
const twoFactorDesc = document.querySelector('#two-factor-desc');
const btnTwoFactor = document.querySelector('#btn-twofactor');
const modalPasswordContent = document.querySelector('.modal__content');
let isTwoFactorEnabled =
  btnTwoFactor?.dataset.isActive === 'true' ? true : false;
const passwordMarkup = `
               <form action="" class="form" id="form-password">
                  <h2 class="heading-secondary ma-bt-lg heading-form">Password Required</h2>
                  <div class="form__group ma-bt-md">
                      <label for="password" class="form__label">Password</label>
                      <input type="password" id="password" class="form__input" placeholder="••••••••" required minlength="8">
                      <p class="cta__form">In order to execute this action, we'll need your password</p>
                  </div>
                  <div class="form__group">
                      <button class="btn btn--green">Continue</button>
                  </div>
                </form>
           `;

// Open the modal window
// @params tourId - The tour that will be showed
export const openDateModal = async (tourId) => {
  clearModal();
  const tour = await fetchRequest({
    method: 'GET',
    url: `tours/${tourId}`,
    returnData: true,
  });
  if (!tour) {
    return showAlert('error', 'Sorry this tour is not available');
  }
  const { maxPerDay, participants, startDates } = tour.data.data;
  const leftParticipants = calculateLeftParticipants(maxPerDay, participants);
  handleLeftParticipants(startDates, leftParticipants);
  printOptions(startDates, leftParticipants);
  createBookButtonListener(tourId);
};

// Print all the selectable options to pick up a date
// @params startDate, leftParticipants
const printOptions = (startDates, leftParticipants) => {
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
};

// Clear all the previous info printed in the modal
const clearModal = () => {
  modalDateText.textContent = 'Just one more step...';
  modalDate.style.display = 'block';
  dateOptions.innerHTML = `
    <option class="select__option" value="">Please select a booking date</option>
  `;
};

// Calculate the left participants based on participants per day and participants total
// @params maxPerDay - The max amount of participants per day (array)
// @params participants - The actual number of participants per day (array)
const calculateLeftParticipants = (maxPerDay, participants) => {
  const leftParticipants = maxPerDay.map((el, index) => {
    const left = el - participants[index];
    if (left <= 0) return 0;
    return left;
  });
  return leftParticipants;
};

// Show and allert if there's is no booking dates on tour
// @params startDates - Dates of the tour
// @params leftParticipants - Participants available for each date (array)
const handleLeftParticipants = (startDates, leftParticipants) => {
  if (startDates.length <= 0 || leftParticipants.every((curr) => curr <= 0)) {
    showAlert('error', 'All dates on this tour are booked out!');
    dateOptions.disabled = true;
    bookModalDate.disabled = true;
    modalDateText.textContent = 'Sorry, this tour is booked out';
    return;
  }
  dateOptions.disabled = false;
  bookModalDate.disabled = false;
};

// Creates the booklistener to submit the form with an available date
// @params tourId - The id of the selected tour
const createBookButtonListener = (tourId) => {
  formDate.addEventListener('submit', (event) => {
    event.preventDefault();
    const dateValue = event.target.querySelector('#dates').value;
    if (!dateValue) console.error('Please select a date');
    bookTour(tourId, dateValue);
  });
};

const clearPasswordModal = () => {
  modalPassword.style.display = 'none';
  document.querySelector('#form-password').remove();
};

const poblatePasswordModal = () => {
  modalPassword.style.display = 'block';
  modalPasswordContent.insertAdjacentHTML('afterbegin', passwordMarkup);
};

if (closeModal) {
  closeModal.addEventListener('click', () => {
    if (modalDate) {
      modalDate.style.display = 'none';
    }
    if (modalPassword) {
      clearPasswordModal();
      btnTwoFactor.disabled = false;
    }
  });
}

const printTwoFactorRequirements = (messageTitle, blob = null) => {
  twoFactorDesc.textContent = messageTitle;
  btnTwoFactor.classList.toggle('btn--cancel');
  btnTwoFactor.textContent = isTwoFactorEnabled ? 'Disable' : 'Enable';

  if (isTwoFactorEnabled) {
    // Disable options
    btnTwoFactor.classList.replace('btn--green', 'btn--white');
    const parentElement = document.querySelector('.paragraph-profile');

    const qr = document.createElement('img');
    qr.src = URL.createObjectURL(blob);
    qr.id = 'qr-image';

    const qrDescription = document.createElement('p');
    qrDescription.classList.add('paragraph-profile--bold');
    qrDescription.textContent =
      "Two factor authentication is now enabled. Scan the following QR code using your phone's authenticator application.";
    qrDescription.id = 'qr-desc';

    parentElement.insertAdjacentElement('afterend', qr);
    parentElement.insertAdjacentElement('afterend', qrDescription);
  } else {
    // Enable options
    btnTwoFactor.classList.replace('btn--white', 'btn--green');
    const qrImage = document.querySelector('#qr-image');
    const qrDesc = document.querySelector('#qr-desc');
    if (qrImage) qrImage.remove();
    if (qrDesc) qrDesc.remove();
  }
};

const readPassword = (event) => {
  const passwordInput = event.target.querySelector('#password');
  const password = passwordInput.value;
  return password;
};

const enableTwoFactor = async function (event) {
  event.preventDefault();
  const password = readPassword(event);

  const blob = await fetchAndStream(password);
  clearPasswordModal();
  btnTwoFactor.textContent = isTwoFactorEnabled ? 'Disable' : 'Enable';
  btnTwoFactor.disabled = false;

  if (!(blob instanceof Blob)) {
    return;
  }
  isTwoFactorEnabled = true;
  printTwoFactorRequirements(
    'You have enabled two factor authentication.',
    blob
  );
};

const disableTwoFactor = async function (event) {
  event.preventDefault();
  const password = readPassword(event);

  const response = await fetchRequest({
    body: {
      password,
    },
    method: 'POST',
    url: 'users/2fa/disable',
    messageOnSuccess: 'Two factor authentication is disabled',
  });
  clearPasswordModal();
  btnTwoFactor.textContent = isTwoFactorEnabled ? 'Disable' : 'Enable';
  btnTwoFactor.disabled = false;

  if (!response) return;
  isTwoFactorEnabled = false;
  printTwoFactorRequirements('You have not enabled two factor authentication.');
};

const toggleTwoFactor = (callback) => {
  const formPassword = document.querySelector('#form-password');
  let passwordHandler = (event) => {
    callback(event);
    formPassword.removeEventListener('submit', passwordHandler);
  };
  formPassword.addEventListener('submit', passwordHandler);
};

const twoFactorConstructor = () => {
  if (!isTwoFactorEnabled) return enableTwoFactor;
  else return disableTwoFactor;
};

export const openPasswordModal = () => {
  poblatePasswordModal();
  toggleTwoFactor(twoFactorConstructor());
};
