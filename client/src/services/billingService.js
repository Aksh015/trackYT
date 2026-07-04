import api from './api';

const billingService = {
  createCheckoutSession: () => api.post('/billing/create-checkout-session'),
  mockSuccess: () => api.post('/billing/mock-success'),
  mockDowngrade: () => api.post('/billing/mock-downgrade'),
};

export default billingService;
