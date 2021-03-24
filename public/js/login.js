/* eslint-disable */
const login = async (email, password) => {
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
      alert('Logged in successfully');
      setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    alert(error);
  }
};

document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = e.target.querySelector('#email').value;
  const password = e.target.querySelector('#password').value;
  login(email, password);
});
