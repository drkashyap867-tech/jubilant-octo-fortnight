#!/usr/bin/env node

const http = require('http');

console.log('🧪 Testing Medical College Counseling Platform Cutoff System');
console.log('==========================================================\n');

const BASE_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:3001';

// Test configuration
const tests = [
    {
        name: 'Backend Health Check',
        url: `${BASE_URL}/api/cutoff/counselling-types`,
        method: 'GET',
        expectedStatus: 200
    },
    {
        name: 'Get Counselling Types',
        url: `${BASE_URL}/api/cutoff/counselling-types`,
        method: 'GET',
        expectedStatus: 200,
        validateData: (data) => {
            return data.length > 0 && data.some(item => item.type_code === 'AIQ_PG');
        }
    },
    {
        name: 'Get Available Years',
        url: `${BASE_URL}/api/cutoff/years`,
        method: 'GET',
        expectedStatus: 200,
        validateData: (data) => {
            return data.length > 0 && data.some(item => item.counselling_year === 2024);
        }
    },
    {
        name: 'Get Rounds for AIQ_PG 2024',
        url: `${BASE_URL}/api/cutoff/rounds/AIQ_PG/2024`,
        method: 'GET',
        expectedStatus: 200,
        validateData: (data) => {
            return data.length > 0 && data.some(item => item.round_number === 1);
        }
    },
    {
        name: 'Get AIQ Data',
        url: `${BASE_URL}/api/cutoff/aiq-data`,
        method: 'GET',
        expectedStatus: 200,
        validateData: (data) => {
            return data.quotas && data.categories && data.quotas.length > 0;
        }
    },
    {
        name: 'Search Cutoff Data - AIQ_PG',
        url: `${BASE_URL}/api/cutoff/search?counselling_type=AIQ_PG&counselling_year=2024&limit=3`,
        method: 'GET',
        expectedStatus: 200,
        validateData: (data) => {
            return data.length > 0 && data[0].college_name && data[0].course_name;
        }
    },
    {
        name: 'Get Statistics',
        url: `${BASE_URL}/api/cutoff/stats?counselling_type=AIQ_PG&counselling_year=2024`,
        method: 'GET',
        expectedStatus: 200,
        validateData: (data) => {
            return data.total_records > 0 && data.total_colleges > 0;
        }
    },
    {
        name: 'Frontend Health Check',
        url: `${FRONTEND_URL}`,
        method: 'GET',
        expectedStatus: 200,
        validateData: (data) => {
            return data.includes('react') || data.includes('root') || data.includes('html') || data.includes('DOCTYPE');
        }
    }
];

// Helper function to make HTTP requests
function makeRequest(test) {
    return new Promise((resolve, reject) => {
        const req = http.request(test.url, { method: test.method }, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                let parsedData;
                try {
                    parsedData = JSON.parse(data);
                } catch (e) {
                    parsedData = data;
                }

                resolve({
                    status: res.statusCode,
                    data: parsedData,
                    rawData: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Run tests
async function runTests() {
    let passedTests = 0;
    let totalTests = tests.length;

    console.log(`Running ${totalTests} tests...\n`);

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        console.log(`[${i + 1}/${totalTests}] Testing: ${test.name}`);

        try {
            const response = await makeRequest(test);

            // Check status code
            if (response.status === test.expectedStatus) {
                console.log(`   ✅ Status: ${response.status} (Expected: ${test.expectedStatus})`);

                // Validate data if validation function exists
                if (test.validateData) {
                    if (test.validateData(response.data)) {
                        console.log(`   ✅ Data validation: PASSED`);
                        passedTests++;
                    } else {
                        console.log(`   ❌ Data validation: FAILED`);
                        console.log(`      Response:`, JSON.stringify(response.data, null, 2));
                    }
                } else {
                    passedTests++;
                }
            } else {
                console.log(`   ❌ Status: ${response.status} (Expected: ${test.expectedStatus})`);
                console.log(`      Response:`, response.rawData.substring(0, 200) + '...');
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        console.log('');
    }

    // Summary
    console.log('📊 Test Results Summary');
    console.log('========================');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
        console.log('\n🎉 All tests passed! The cutoff system is working correctly.');
        console.log('\n🚀 Next steps:');
        console.log('1. Open http://localhost:3001/cutoff-ranks in your browser');
        console.log('2. Verify the beautiful UI/UX design is displaying');
        console.log('3. Test the dynamic filters (AIQ vs State counselling)');
        console.log('4. Verify the stats cards and results table');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the backend and frontend services.');
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check if backend is running: ./start-development.sh status');
        console.log('2. Check if frontend is running: ./start-development.sh status');
        console.log('3. Check backend logs: ./start-development.sh logs');
        console.log('4. Restart services: ./start-development.sh restart');
    }
}

// Check if services are running before running tests
async function checkServices() {
    console.log('🔍 Checking if services are running...\n');

    try {
        const backendResponse = await makeRequest({
            url: `${BASE_URL}/api/cutoff/counselling-types`,
            method: 'GET'
        });

        if (backendResponse.status === 200) {
            console.log('✅ Backend is running and responding');
        } else {
            console.log('❌ Backend is not responding correctly');
            return false;
        }

        const frontendResponse = await makeRequest({
            url: `${FRONTEND_URL}`,
            method: 'GET'
        });

        if (frontendResponse.status === 200) {
            console.log('✅ Frontend is running and responding');
        } else {
            console.log('❌ Frontend is not responding correctly');
            return false;
        }

        console.log('');
        return true;
    } catch (error) {
        console.log('❌ Error checking services:', error.message);
        console.log('\n💡 Make sure both services are running:');
        console.log('   ./start-development.sh start');
        return false;
    }
}

// Main execution
async function main() {
    const servicesRunning = await checkServices();

    if (servicesRunning) {
        await runTests();
    } else {
        console.log('\n🚨 Services are not running. Please start them first:');
        console.log('   ./start-development.sh start');
        process.exit(1);
    }
}

// Run the main function
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runTests, checkServices };
