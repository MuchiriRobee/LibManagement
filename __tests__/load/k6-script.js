import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // ramp up
    { duration: '5m', target: 500 },   // stable
    { duration: '2m', target: 1000 },  // spike
    { duration: '2m', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.01'],   // <1% errors
  },
};

const BASE_URL = 'http://localhost:3000/api';

export default function () {
  // Login once per VU
  let loginRes = http.post(`${BASE_URL}/users/login`, JSON.stringify({
    email: `user${__VU}@test.com`,
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const token = loginRes.json().data?.token || '';

  // Browse books
  let booksRes = http.get(`${BASE_URL}/books`);
  check(booksRes, { 'books success': (r) => r.status === 200 });

  // Borrow a random book
  if (token) {
    http.post(`${BASE_URL}/borrow`, JSON.stringify({ book_id: 1 + (__VU % 10) }), {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  }

  sleep(1);
}