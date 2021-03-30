import { showAlert } from '../alerts';
export const fetchRequest = async ({ body, method, url, messageOnSuccess }) => {
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
    const response = await fetch(`http://127.0.0.1:3000/api/v1/users/${url}`, {
      method: method,
      mode: 'cors',
      headers,
      body: bodyData,
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
