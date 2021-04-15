import { bookTour } from './stripe';
import { showAlert } from './alerts';
import { fetchRequest } from './utils/fetchRequest';

const formDate = document.querySelector('#form-date');
const modalDateText = document.querySelector('#modal-date-text');
const bookModalDate = document.querySelector('#modal-date-book');
const dateOptions = document.querySelector('#dates');
const modalDate = document.querySelector('#modal-date');
const closeModal = document.querySelector('.modal__close');

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

if (closeModal) {
  closeModal.addEventListener('click', () => {
    modalDate.style.display = 'none';
  });
}
