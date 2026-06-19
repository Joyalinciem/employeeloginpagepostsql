const { generate } = require('otplib');
const { crypto } = require('@otplib/plugin-crypto-noble');
const { base32 } = require('@otplib/plugin-base32-scure');

const base = 'http://localhost:5000';
const email = `mfa_test_${Date.now()}@example.com`;
const password = 'Password123!';

async function run(){
  try{
    console.log('Registering user...');
    let r = await fetch(`${base}/api/register`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name:'MFA Test', email, password})
    });
    console.log('Register status', r.status);
    let j = await r.json().catch(()=>({}));
    console.log('Register response', j);

    console.log('Logging in to get auth token...');
    r = await fetch(`${base}/api/login`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email, password})
    });
    j = await r.json();
    console.log('Login response', j);
    let token = j.token;

    if(!token){
      console.log('No token returned (user may already exist). Trying to login again to retrieve token without registering.');
      // try login again (already done)
    }

    if(!token){
      console.error('Cannot obtain auth token to continue TOTP setup. Exiting.');
      process.exit(1);
    }

    // Setup TOTP
    console.log('Requesting TOTP setup (QR + secret)...');
    r = await fetch(`${base}/api/mfa/setup`, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
      body: JSON.stringify({method:'totp'})
    });
    j = await r.json();
    console.log('Setup response keys:', Object.keys(j));
    const secret = j.secret || null;
    if(!secret){
      console.error('No secret returned for TOTP setup. Response:', j);
      process.exit(1);
    }

    console.log('Secret received:', secret);

    // generate current token
    const code = await generate({ secret, crypto, base32 });
    console.log('Generated TOTP code:', code);

    // verify setup
    console.log('Verifying TOTP setup...');
    r = await fetch(`${base}/api/mfa/verify-setup`, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
      body: JSON.stringify({method:'totp', code})
    });
    j = await r.json();
    console.log('Verify setup response', j);

    console.log('Now logging in to trigger MFA flow...');
    r = await fetch(`${base}/api/login`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email, password})
    });
    j = await r.json();
    console.log('Login (post-setup) response', j);

    if(j.requiresMFA && j.mfaMethod === 'totp'){
      const verifyBody = { email, code };
      console.log('Verifying MFA with', verifyBody);
      r = await fetch(`${base}/api/verify-mfa`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(verifyBody)
      });
      j = await r.json();
      console.log('Final verify response', j);
    } else {
      console.log('MFA not required after setup (unexpected). Full login response:', j);
    }

    console.log('Done');
  } catch (err){
    console.error('Error during test run', err);
    process.exit(1);
  }
}

run();
