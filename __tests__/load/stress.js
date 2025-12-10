import http from 'k6/http';
import { check, sleep } from 'k6';

//Inacheki system ukiongeza load beyond limits hadi mahali itabreak

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // ramp up slow
    { duration: '5m', target: 500 },  // hold at medium stress
    { duration: '2m', target: 1000 }, // high stress
    { duration: '2m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000/api';

export default function () {
  let loginRes = http.post(`${BASE_URL}/users/login`, JSON.stringify({
    email: `user${__VU}@test.com`,
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const token = loginRes.json().data?.token || '';

  let booksRes = http.get(`${BASE_URL}/books`);
  check(booksRes, { 'books success': (r) => r.status === 200 });

  if (token) {
    http.post(`${BASE_URL}/borrow`, JSON.stringify({ book_id: 1 + (__VU % 10) }), {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  }

  sleep(1);
}