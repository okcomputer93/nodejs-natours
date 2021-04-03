import { showAlert } from '../alerts';
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
    const response = await fetch(`http://127.0.0.1:3000/api/v1/${url}`, {
      method: method,
      mode: 'cors',
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
