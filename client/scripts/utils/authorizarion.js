export async function getIp() {
  try {
    const res = await fetch('https://api.ipify.org/?format=json');
    const IPdata = await res.json();
    return IPdata.ip;
  } catch (error) {
    console.error(error);
  }
}

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  localStorage.setItem('token', token);
}

export function removeToken() {
  localStorage.removeItem('token');
}
