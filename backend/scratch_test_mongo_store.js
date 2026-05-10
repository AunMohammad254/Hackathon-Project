const mongoose = require('mongoose');
const MongoStore = require('rate-limit-mongo');

async function test() {
    const store = new MongoStore({
        collection: mongoose.connection.collection('expressRateRecords'),
        expireTimeMs: 15 * 60 * 1000,
        errorHandler: console.error.bind(console, 'rate-limit-mongo')
    });
    console.log('Store initialized');
    
    // Connect now
    await mongoose.connect('mongodb://localhost:27017/clinic-saas');
    console.log('Connected to MongoDB');
    
    store.incr('test-key', (err, counter, expiry) => {
        if (err) console.error('Error incrementing:', err);
        else console.log('Success incrementing!', counter);
        
        mongoose.disconnect();
        process.exit(0);
    });
}

test().catch(console.error);
