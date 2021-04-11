import { fetchRequest } from './utils/fetchRequest';

const stripe = Stripe(
  'pk_test_51IbvBQAJmE6y1FXpqDaykmGroygPhSDMenV4fqNQP4DbK1nUeBgw2N4yizSkC2fWU7EdN7Q8sTGiyPx911qI26Ck00iiZOTS2f'
);

export const bookTour = async (tourId, date) => {
  // 1) Get checkout session from API
  const session = await fetchRequest({
    method: 'GET',
    url: `bookings/checkout-session/${tourId}/?date=${date}`,
    returnData: true,
  });

  if (!session) return;

  // 2) Create checkout form + charge credit card
  stripe.redirectToCheckout({ sessionId: session.session.id });
};
