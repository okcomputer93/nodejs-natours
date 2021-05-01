import '@babel/polyfill';
import { displayMap } from './mapbox';
import { showAlert } from './alerts';
import { fetchRequest } from './utils/fetchRequest';
import { fetchLogin } from './utils/fetchRequest';
import { fetchSignUp } from './utils/fetchRequest';
import { openDateModal } from './modal';
import { openPasswordModal } from './modal';

// DOM ELEMENTS
const mapBox = document.querySelector('#map');
const loginBox = document.querySelector('.login-form');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('#update-data');
const passwordUpdateForm = document.querySelector('#update-password');
const bookBtn = document.querySelector('#book-tour');
const modalDate = document.querySelector('#modal-date');
const cancelModalDate = document.querySelector('#modal-date-cancel');

const twoFactorBtn = document.querySelector('#btn-twofactor');

let loginForm = document.querySelector('#login');
const resendEmail = document.querySelector('#resend-email');

const signUpForm = document.querySelector('#signup');

const starsRate = document.querySelector('.stars__rate');
const selectableStars = document.querySelectorAll('.star__selectable');
const starsContainer = document.querySelector('.stars__rate');
const formReview = document.querySelector('#form-review');

const cardContainer = document.querySelector('.card-container');

// VALUES

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

const loginFormEventListener = () => {
  document.querySelector('#login').addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    handleLogin(email, password);
  });
};

if (loginForm) {
  loginFormEventListener();
}

const submitTokenEventListener = async (email, password) => {
  document
    .querySelector('#login-twofactor')
    .addEventListener('submit', async (event) => {
      event.preventDefault();
      const authToken = document.querySelector('#auth-token').value;
      await fetchLogin(email, password, authToken);
      document.querySelector('#btn-auth-token').blur();
    });
};

const backEventListener = (loginTemplate) => {
  document
    .querySelector('#btn-auth-back')
    .addEventListener('click', (event) => {
      loginBox.innerHTML = '';
      loginBox.innerHTML = loginTemplate;
      loginFormEventListener();
    });
};

const handleLogin = async (email, password) => {
  const data = await fetchLogin(email, password);
  if (data?.requireTwoFactorAuth) {
    const loginTemplate = loginBox.innerHTML;
    loginBox.innerHTML = '';
    const twoFactorTemplate = `
        <h2 class="heading-secondary ma-bt-lg heading-form">Two Factor Auth is Enabled</h2>
        <form class="form form--token" id="login-twofactor">
          <div class="form__group">
            <label for="auth-token" class="form__label">Authentication Code</label>
            <input type="text" minlength="6" required autofocus id="auth-token" class="form__input">
            <p class="cta__form">Please provide the authentication code from your app</p>
          </div>
          <div class="form__group group__buttons">
              <button id="btn-auth-token" class="btn btn--green">Confirm</button>
              <button type="button" id="btn-auth-back" class="btn d">Back</button>
          </div>
        </form>
      `;
    loginBox.insertAdjacentHTML('afterbegin', twoFactorTemplate);

    submitTokenEventListener(email, password);
    backEventListener(loginTemplate);
  }
};

if (twoFactorBtn) {
  twoFactorBtn.addEventListener('click', function (event) {
    this.disabled = true;
    openPasswordModal();
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

if (signUpForm) {
  signUpForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    const passwordConfirm = document.querySelector('#password-confirm').value;
    fetchSignUp(name, email, password, passwordConfirm);
  });
}

if (starsRate) {
  starsRate.addEventListener('click', (event) => {
    document.querySelector('.is-error')?.remove();

    selectableStars.forEach((star) => star.classList.remove('star__selected'));
    const value = event.target.closest('.star__selectable').dataset.value;
    starsContainer.dataset.value = value;
    const selectedStars = document.querySelectorAll(
      `[data-value="${value}"],
      [data-value="${value}"] ~ .star__selectable`
    );
    selectedStars.forEach((star) => star.classList.add('star__selected'));
  });
}

if (formReview) {
  formReview.addEventListener('submit', async (event) => {
    event.preventDefault();
    const rating = +starsContainer.dataset.value;
    const textArea = event.target.querySelector('.stars__review');
    const review = textArea.value;
    const tourId = document.querySelector('#book-tour').dataset.tourId;
    if (!rating || rating === -1) {
      textArea.insertAdjacentHTML(
        'afterend',
        `
      <p class="is-error">Please select a rating based on the stars.</p>
    `
      );
      return;
    }
    const success = await fetchRequest({
      body: {
        rating,
        review,
      },
      method: 'POST',
      url: `tours/${tourId}/reviews`,
      returnData: true,
    });
    if (success) {
      showAlert('success', 'Thank you for your review');
      setTimeout(() => location.reload(), 1500);
    }
  });
}

if (cardContainer) {
  cardContainer.addEventListener('click', async (event) => {
    if (!event.target.closest('.like-group')) return;
    const heartIcon = event.target.closest('.like-button');
    const tourId = heartIcon.dataset.tourId;
    if (heartIcon.dataset.isFav === 'true') {
      heartIcon.classList.remove('like-action');
      heartIcon.firstElementChild.setAttribute(
        'href',
        '/img/icons.svg#icon-heart'
      );
      heartIcon.dataset.isFav = 'false';
    } else {
      heartIcon.classList.add('like-action');
      heartIcon.firstElementChild.setAttribute(
        'href',
        '/img/icons.svg#icon-filled-heart'
      );
      heartIcon.dataset.isFav = 'true';
    }

    const response = await fetchRequest({
      url: 'tours/favTour',
      body: { tourId },
      returnData: true,
      method: 'POST',
    });
    // if (response) {
    //   if (response.data.isFav)
    //     heartIcon.firstElementChild.setAttribute(
    //       'href',
    //       '/img/icons.svg#icon-filled-heart'
    //     );
    //   else
    //     heartIcon.firstElementChild.setAttribute(
    //       'href',
    //       '/img/icons.svg#icon-heart'
    //     );
    // }
  });
}
