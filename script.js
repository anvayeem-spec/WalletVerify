// ---- element references ----
const addressInput = document.getElementById('address');
const apiKeyInput = document.getElementById('apiKey');
const verifyBtn = document.getElementById('verifyBtn');
const errorLine = document.getElementById('errorLine');
const errorText = document.getElementById('errorText');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const result = document.getElementById('result');
const resultAddress = document.getElementById('resultAddress');
const stamp = document.getElementById('stamp');
const statsGrid = document.getElementById('statsGrid');

const ETHERSCAN_BASE = 'https://api.etherscan.io/v2/api';
const CHAIN_ID = 1; // Ethereum mainnet

// ---- small UI helpers ----
function showError(msg){
  errorText.textContent = msg;
  errorLine.classList.add('show');
}
function clearError(){
  errorLine.classList.remove('show');
  errorText.textContent = '';
}
function setLoading(on, text){
  loading.classList.toggle('show', on);
  if(text) loadingText.textContent = text;
  verifyBtn.disabled = on;
}

// ---- EIP-55 checksum ----
// Ethereum addresses are case-insensitive at the protocol level, but EIP-55
// defines a mixed-case checksum: each hex character in the address is
// upper-cased or lower-cased based on the keccak256 hash of the lowercase
// address. Wallets use this so a typo flips the checksum and looks "wrong"
// instead of silently sending funds to a different address.
function toChecksumAddress(address){
  address = address.toLowerCase().replace('0x', '');
  const hash = sha3.keccak256(address); // from the js-sha3 library loaded in index.html
  let ret = '0x';
  for(let i = 0; i < address.length; i++){
    ret += parseInt(hash[i], 16) >= 8 ? address[i].toUpperCase() : address[i];
  }
  return ret;
}

function formatAddressHTML(rawInput){
  // shows the address with checksum casing applied, colored to show correctness
  const lower = rawInput.toLowerCase();
  const checksummed = toChecksumAddress(lower);
  const isAllLower = rawInput === lower;
  const isAllUpper = rawInput.toLowerCase() === rawInput.toUpperCase() ? false : rawInput === ('0x' + rawInput.slice(2).toUpperCase());
  const matchesChecksum = rawInput === checksummed;

  if(isAllLower || isAllUpper){
    // no mixed case given, so there's nothing to validate against - just show it normalized
    return { html: escapeHTML(checksummed), checksumState: 'none' };
  }
  if(matchesChecksum){
    return { html: `<span class="cs-good">${escapeHTML(checksummed)}</span>`, checksumState: 'good' };
  }
  return { html: `<span class="cs-bad">${escapeHTML(rawInput)}</span>`, checksumState: 'bad' };
}

function escapeHTML(s){
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function isValidFormat(addr){
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

// ---- Etherscan API calls ----
// Etherscan's v2 API is one endpoint for every chain; you pick the chain
// with chainid (1 = mainnet) instead of hitting a different host per chain.
async function etherscanCall(params, apiKey){
  const url = new URL(ETHERSCAN_BASE);
  url.searchParams.set('chainid', CHAIN_ID);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  if(apiKey) url.searchParams.set('apikey', apiKey);
  const res = await fetch(url.toString());
  if(!res.ok) throw new Error('Network error contacting Etherscan');
  return res.json();
}

// eth_getCode returns the contract bytecode at an address.
// Wallets (EOAs) have no code, so the result is exactly "0x".
// Any other value means there's a contract deployed at this address.
async function getIsContract(address, apiKey){
  const data = await etherscanCall({ module: 'proxy', action: 'eth_getCode', address, tag: 'latest' }, apiKey);
  if(data.error) throw new Error(data.error.message || 'Etherscan error checking code');
  return data.result && data.result !== '0x';
}

// account balance comes back in wei (10^18 wei = 1 ETH) as a string,
// so it's parsed as a BigInt before converting to a normal ETH float.
async function getBalance(address, apiKey){
  const data = await etherscanCall({ module: 'account', action: 'balance', address, tag: 'latest' }, apiKey);
  if(data.status === '0' && data.message !== 'OK') throw new Error(data.result || 'Etherscan error fetching balance');
  const wei = BigInt(data.result);
  const eth = Number(wei) / 1e18;
  return eth;
}

// eth_getTransactionCount returns the account's nonce - the number of
// transactions it has SENT. It does not count incoming transactions,
// since those don't consume the sender's nonce.
async function getTxCount(address, apiKey){
  const data = await etherscanCall({ module: 'proxy', action: 'eth_getTransactionCount', address, tag: 'latest' }, apiKey);
  if(data.error) throw new Error(data.error.message || 'Etherscan error fetching tx count');
  return parseInt(data.result, 16);
}

// ---- rendering ----
function statCard(label, value, sub, extraClass){
  return `<div class="stat ${extraClass||''}">
    <div class="stat-label">${label}</div>
    <div class="stat-value">${value}</div>
    ${sub ? `<div class="stat-sub">${sub}</div>` : ''}
  </div>`;
}

// builds the circular "stamp" seal shown next to the result.
// kind is 'invalid' | 'wallet' | 'contract' and drives color, icon, and label text.
function stampSVG(kind){
  const colorMap = { invalid: 'var(--red)', wallet: 'var(--green)', contract: 'var(--blue)' };
  const labelMap = { invalid: 'INVALID', wallet: 'WALLET', contract: 'CONTRACT' };
  const color = colorMap[kind];
  const label = labelMap[kind];
  const markPath = kind === 'invalid'
    ? '<path d="M34 34 L58 58 M58 34 L34 58" stroke-width="6" stroke-linecap="round"/>'
    : '<path d="M33 47 L42 57 L60 36" fill="none" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>';

  const id = 'arc' + Math.random().toString(36).slice(2,8); // unique id so multiple stamps don't clash

  return `
  <svg class="stamp animate" viewBox="0 0 92 92" xmlns="http://www.w3.org/2000/svg" stroke="${color}" fill="none">
    <defs>
      <path id="${id}" d="M 46 12 A 34 34 0 1 1 45.99 12" fill="none"/>
    </defs>
    <circle cx="46" cy="46" r="40" stroke-width="2" opacity="0.9"/>
    <circle cx="46" cy="46" r="34" stroke-width="1" opacity="0.45"/>
    ${markPath}
    <text font-family="IBM Plex Mono, monospace" font-size="8.4" font-weight="600" letter-spacing="2.5" fill="${color}" stroke="none">
      <textPath href="#${id}" startOffset="2">· ${label} · ${label} ·</textPath>
    </text>
  </svg>`;
}

// ---- main flow, triggered by the Verify button ----
async function handleVerify(){
  clearError();
  result.classList.remove('show');
  statsGrid.innerHTML = '';

  const raw = addressInput.value.trim();
  if(!raw){
    showError('Enter an address first.');
    return;
  }

  const hasPrefix = raw.startsWith('0x') || raw.startsWith('0X');
  const body = hasPrefix ? raw.slice(2) : raw;
  const candidate = '0x' + body;

  // step-by-step validation so the error message matches the specific problem
  if(!hasPrefix){
    showError('Address should start with "0x".');
    return;
  }
  if(!/^[0-9a-fA-F]*$/.test(body)){
    showError('Address contains non-hex characters.');
    return;
  }
  if(body.length !== 40){
    showError(`Address should be 40 hex characters after "0x" — this one has ${body.length}.`);
    return;
  }

  const valid = isValidFormat(candidate);
  if(!valid){
    showError('Not a valid Ethereum address format.');
    renderResult({ candidate, valid:false });
    return;
  }

  const fmt = formatAddressHTML(candidate);
  if(fmt.checksumState === 'bad'){
    showError('This address fails EIP-55 checksum validation — check for a typo before using it.');
  }

  const apiKey = apiKeyInput.value.trim();

  // format/checksum checks don't need the network - only stop here if
  // there's no key, since balance/type/tx-count require Etherscan
  if(!apiKey){
    renderResult({ candidate, valid:true, fmt, noKey:true });
    return;
  }

  setLoading(true, 'Checking chain state…');
  try{
    // fire all three Etherscan calls in parallel rather than one after another
    const [isContract, balance, txCount] = await Promise.all([
      getIsContract(candidate, apiKey),
      getBalance(candidate, apiKey),
      getTxCount(candidate, apiKey)
    ]);
    setLoading(false);
    renderResult({ candidate, valid:true, fmt, isContract, balance, txCount });
  }catch(err){
    setLoading(false);
    showError(err.message || 'Something went wrong calling Etherscan.');
    renderResult({ candidate, valid:true, fmt, errorFetching:true });
  }
}

function renderResult({ candidate, valid, fmt, isContract, balance, txCount, noKey, errorFetching }){
  resultAddress.innerHTML = valid ? fmt.html : escapeHTML(candidate);

  let kind = valid ? 'wallet' : 'invalid';
  if(valid && isContract) kind = 'contract';
  stamp.outerHTML = stampSVG(kind); // replaces the placeholder <div id="stamp"> with the SVG

  let html = '';

  if(!valid){
    html += statCard('Format', 'Invalid', 'Not a well-formed 20-byte hex address', 'full-row');
    statsGrid.innerHTML = html;
    result.classList.add('show');
    return;
  }

  const csLabel = fmt.checksumState === 'good' ? 'Valid (EIP-55 checksummed)'
    : fmt.checksumState === 'bad' ? 'Fails checksum — verify carefully'
    : 'Valid format (no checksum casing given)';
  html += statCard('Format', 'Valid', csLabel, 'full-row');

  if(noKey){
    html += statCard('Type / balance / tx count', '—', 'Add an Etherscan API key above to fetch live chain data', 'full-row');
  } else if(errorFetching){
    html += statCard('Chain data', 'Unavailable', 'Etherscan lookup failed — see the message above', 'full-row');
  } else {
    const typePill = isContract
      ? `<span class="type-pill contract"><span class="dot"></span>Contract</span>`
      : `<span class="type-pill wallet"><span class="dot"></span>Wallet (EOA)</span>`;
    html += `<div class="stat full-row">
      <div class="stat-label">Address type</div>
      <div class="stat-value small">${typePill}</div>
    </div>`;
    html += statCard('Balance', `${balance.toFixed(5)} ETH`, null);
    html += statCard('Tx count (sent)', txCount.toLocaleString(), 'From account nonce');
  }

  statsGrid.innerHTML = html;
  result.classList.add('show');
}

// ---- wire up events ----
verifyBtn.addEventListener('click', handleVerify);
addressInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') handleVerify(); });
