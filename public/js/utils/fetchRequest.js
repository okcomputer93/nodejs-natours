import { showAlert } from '../alerts';
export const fetchRequest = async ({ body, method, url, messageOnSuccess }) => {
  try {
    const response = await fetch(`http://127.0.0.1:3000/api/v1/users/${url}`, {
      method: method,
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw Error(data.message);
    }

    if (data.status === 'success') {
      if (messageOnSuccess) showAlert('success', messageOnSuccess);
      return true;
    }
  } catch (error) {
    console.error(error);
    showAlert('error', error);
  }
};
