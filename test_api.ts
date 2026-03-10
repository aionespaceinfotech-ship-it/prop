import axios from 'axios';

const API_URL = 'http://localhost:30000/api';

async function runTests() {
  console.log('🚀 Starting API Tests...');

  try {
    // 1. Test Login
    console.log('\n1. Testing Login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@propcrm.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    console.log('✅ Login successful');

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Test Validation (Invalid Property)
    console.log('\n2. Testing Validation (Invalid Property)...');
    try {
      await axios.post(`${API_URL}/properties`, {
        title: 'S', // Too short
        type: 'Flat',
        location: 'Test',
        price: -100, // Negative price
        area: 100
      }, authHeader);
      console.log('❌ Validation failed to catch errors');
    } catch (err: any) {
      if (err.response?.status === 400) {
        console.log('✅ Validation correctly caught errors:', JSON.stringify(err.response.data.details));
      } else {
        console.log('❌ Unexpected error:', err.message);
      }
    }

    // 3. Test Valid Property Creation
    console.log('\n3. Testing Valid Property Creation...');
    const propRes = await axios.post(`${API_URL}/properties`, {
      title: 'API Test Property',
      type: 'Flat',
      location: 'Test Location',
      price: 5000000,
      area: 1200,
      status: 'Available'
    }, authHeader);
    console.log('✅ Property created with ID:', propRes.data.id);

    // 4. Test Authorization (Broker accessing Admin route)
    console.log('\n4. Testing Authorization (Broker accessing Admin route)...');
    // First login as broker
    const brokerLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'amit@propcrm.com',
      password: 'broker123'
    });
    const brokerToken = brokerLogin.data.token;
    const brokerHeader = { headers: { Authorization: `Bearer ${brokerToken}` } };

    try {
      await axios.get(`${API_URL}/agents`, brokerHeader);
      console.log('❌ Authorization failed to block broker from admin route');
    } catch (err: any) {
      if (err.response?.status === 403) {
        console.log('✅ Authorization correctly blocked broker');
      } else {
        console.log('❌ Unexpected error:', err.response?.status, err.message);
      }
    }

    console.log('\n✨ All tests completed successfully!');
  } catch (err: any) {
    console.error('\n💥 Test suite failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
