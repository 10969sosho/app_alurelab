import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = (__ENV.BASE_URL || 'https://app.alurelab.com').replace(/\/$/, '');
const stores = (__ENV.STORE_SLUGS || '').split(',').map((value) => value.trim()).filter(Boolean);

export const options = {
  vus: Number(__ENV.VUS || 100),
  duration: __ENV.DURATION || '60s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  if (stores.length === 0) throw new Error('STORE_SLUGS wajib berisi store QA, bukan production tenant acak.');

  const slug = stores[__VU % stores.length];
  const headers = { 'X-Store-Slug': slug };
  const store = http.get(`${baseUrl}/api/v1/store`, { headers, tags: { route: 'store' } });
  const products = http.get(`${baseUrl}/api/v1/products?per_page=24`, { headers, tags: { route: 'products' } });

  check(store, { 'store 200': (response) => response.status === 200 });
  check(products, { 'products 200': (response) => response.status === 200 });
  sleep(1);
}
