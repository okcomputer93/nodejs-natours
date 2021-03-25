/* eslint-disable */
import { showAlert } from './alerts';
export const login = async (email, password) => {
  console.log(email, password);
  const body = JSON.stringify({
    email,
    password,
  });
  try {
    const response = await fetch('http://127.0.0.1:3000/api/v1/users/login', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      throw Error(data.message);
    }

    if (data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error);
  }
};
