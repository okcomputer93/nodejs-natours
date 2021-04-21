import { showAlert } from '../alerts';

const ajax = async ({ url, method, headers, body }) => {
  try {
    return await fetch(`http://127.0.0.1:3000/api/v1/${url}`, {
      method,
      mode: 'cors',
      headers,
      body,
    });
  } catch (error) {
    throw error;
  }
};

export const fetchRequest = async ({
  body,
  method,
  url,
  messageOnSuccess,
  returnData = false,
}) => {
  let headers = { 'Content-Type': 'application/json' };
  let bodyData = JSON.stringify(body);

  if (body instanceof FormData) {
    bodyData = JSON.stringify({ ...Object.fromEntries([...body]) });

    if (body.has('photo')) {
      // Modify headers to allow browser automatically put multipart/form-data
      headers = {};
      // Don't stringify the body if includes a file (photo)
      bodyData = body;
    }
  }

  try {
    const response = await ajax({
      url,
      method,
      headers,
      body: bodyData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw Error(data.message);
    }

    if (data.status === 'success' && !returnData) {
      if (messageOnSuccess) showAlert('success', messageOnSuccess);
      return true;
    }

    if (returnData) {
      return data;
    }
  } catch (error) {
    console.error(error);
    showAlert('error', error);
  }
};

export const fetchLogin = async (email, password, authToken) => {
  try {
    const response = await ajax({
      url: 'users/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        authToken,
      }),
    });

    const data = await response.json();

    if (data.error?.statusCode === 403) {
      setTimeout(() => {
        location.assign('/confirmYourEmail');
      }, 1500);
    }

    if (!response.ok) {
      throw Error(data.message);
    }

    if (data.data.requireTwoFactorAuth) {
      return { requireTwoFactorAuth: true };
    }

    if (data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    console.error(error);
    showAlert('error', error);
  }
};
