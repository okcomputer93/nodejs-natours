/* eslint-disable */
import { showAlert } from './alerts';
export const login = async (email, password) => {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/v1/users/login', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
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

export const logout = async () => {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/v1/users/logout', {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw Error(data.message);
    }

    if (data.status === 'success') location.reload(true);
  } catch (error) {
    showAlert('error', error);
  }
};
