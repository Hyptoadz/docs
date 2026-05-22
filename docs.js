let _hypePrice = 56;
let _mcapQty = 1;
const TOTAL_SUPPLY = 550_000_000;
const TPM = 27855; // TOADZ per mint

// Fetch live HYPE price
async function fetchHypePrice() {
  try {
    const r = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'allMids' })
    });
    const data = await r.json();
    const price = parseFloat(data['HYPE'] || 56);
    if (price > 0) {
      _hypePrice = price;
      if (document.getElementById('calc-hype'))
        document.getElementById('calc-hype').value = price.toFixed(2);
      calcFree();
      calcMcap();
    }
  } catch(e) { console.log('Price fetch failed, using default'); }
}

// Qty +/- for mcap
function chgMcap(d) {
  _mcapQty = Math.max(1, Math.min(5, _mcapQty + d));
  document.getElementById('mcap-qty-display').textContent = _mcapQty;
  updateReceive();
  calcMcap();
}

function updateReceive() {
  const toadz = (_mcapQty * TPM).toLocaleString();
  const cost = (_mcapQty * 0.077).toFixed(3) + ' HYPE';
  const nftText = _mcapQty + ' NFT' + (_mcapQty > 1 ? 's' : '');
  if (document.getElementById('rcv-nft')) {
    document.getElementById('rcv-nft').textContent = nftText;
    document.getElementById('rcv-toadz').textContent = toadz;
    document.getElementById('rcv-cost').textContent = cost;
  }
}

// Why almost free calculator
let _freeQty = 1;

function chgFree(d) {
  _freeQty = Math.max(1, Math.min(5, _freeQty + d));
  document.getElementById('calc-qty-display').textContent = _freeQty;
  calcFree();
}

function calcFree() {
  const hp = _hypePrice;
  const qty = _freeQty || 1;
  // Always assume sold-out LP for positive user experience
  const lpHype = 340.31;
  const listingPrice = (lpHype * hp) / 100_000_000;
  const toadzAmt = qty * TPM;
  const toadzValue = toadzAmt * listingPrice;
  const mintCost = qty * 0.077 * hp;
  const nftCost = mintCost - toadzValue;

  if (document.getElementById('calc-cost')) {
    document.getElementById('calc-cost').textContent = '$' + mintCost.toFixed(2);
    document.getElementById('calc-cost-hype').textContent = (qty * 0.077).toFixed(3) + ' HYPE';
    document.getElementById('calc-toadz-amt').textContent = toadzAmt.toLocaleString();
    document.getElementById('calc-toadz').textContent = '~$' + toadzValue.toFixed(2) + ' at listing';
    if (nftCost <= 0) {
      document.getElementById('calc-nft').textContent = '~$' + Math.abs(nftCost).toFixed(2) + ' profit';
      document.getElementById('calc-nft').style.color = 'var(--green)';
    } else {
      document.getElementById('calc-nft').textContent = '$' + nftCost.toFixed(2) + ' cost';
      document.getElementById('calc-nft').style.color = 'var(--red)';
    }
    document.getElementById('calc-note').textContent =
      'Based on sold-out scenario at live HYPE price (~$' + hp.toFixed(2) + ')';
  }
}

// Mcap scenarios calculator
function calcMcap() {
  const hp = _hypePrice;
  const qty = _mcapQty;
  const toadzOwned = qty * TPM;
  const mintCost = qty * 0.077 * hp;

  // Listing mcap based on sold-out LP
  const lpHype = 340.31;
  const listingPrice = (lpHype * hp) / 100_000_000;
  const listingMcap = listingPrice * TOTAL_SUPPLY;

  const milestones = [
    { label: '🟡 Listing', mcap: listingMcap },
    { label: '$500K', mcap: 500_000 },
    { label: '$1M', mcap: 1_000_000 },
    { label: '$5M', mcap: 5_000_000 },
    { label: '$10M', mcap: 10_000_000 },
    { label: '$50M', mcap: 50_000_000 },
  ];

  const rows = milestones.map((s, i) => {
    const price = s.mcap / TOTAL_SUPPLY;
    const value = toadzOwned * price;
    const roi = ((value - mintCost) / mintCost * 100);
    const roiColor = roi >= 0 ? 'var(--green)' : 'var(--red)';
    const mcapFmt = s.mcap >= 1_000_000 ? '$' + (s.mcap/1_000_000).toFixed(1) + 'M' : '$' + Math.round(s.mcap).toLocaleString();
    const xFmt = (s.mcap / listingMcap).toFixed(1) + '×';
    const isListing = i === 0;

    return `\x3Ctr style="${isListing ? 'background:rgba(123,198,122,.05);' : ''}">
      \x3Ctd style="padding:11px 14px;border-bottom:1px solid var(--border);font-weight:700;color:${isListing ? 'var(--green)' : 'var(--text)'};">${s.label}\x3C/td>
      \x3Ctd style="padding:11px 14px;border-bottom:1px solid var(--border);color:var(--muted);">${mcapFmt} \x3Cspan style="font-size:11px;">(${xFmt})\x3C/span>\x3C/td>
      \x3Ctd style="padding:11px 14px;border-bottom:1px solid var(--border);font-family:monospace;font-size:13px;">$${price.toFixed(6)}\x3C/td>
      \x3Ctd style="padding:11px 14px;border-bottom:1px solid var(--border);font-family:'Archivo Black',sans-serif;color:var(--green);">$${value.toFixed(2)}\x3C/td>
      \x3Ctd style="padding:11px 14px;border-bottom:1px solid var(--border);font-weight:700;color:${roiColor};">${roi >= 0 ? '+' : ''}${roi.toFixed(0)}%\x3C/td>
    \x3C/tr>`;
  });

  const table = document.getElementById('mcap-table');
  if (table) table.innerHTML = rows.join('');
}

// Sidebar active link
const sections = document.querySelectorAll('.doc-section');
const links = document.querySelectorAll('.sidebar-link');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      links.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.sidebar-link[href="#${e.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-20% 0px -70% 0px' });
sections.forEach(s => observer.observe(s));

function copy(id) {
  const val = document.getElementById(id)?.textContent;
  if (!val || val.includes('Pending')) return;
  navigator.clipboard.writeText(val);
  event.target.textContent = 'COPIED!';
  setTimeout(() => event.target.textContent = 'COPY', 1500);
}

function faq(el) {
  const a = el.nextElementSibling, ar = el.querySelector('.faq-arr');
  const open = a.classList.contains('open');
  document.querySelectorAll('.faq-a').forEach(x => x.classList.remove('open'));
  document.querySelectorAll('.faq-arr').forEach(x => x.classList.remove('open'));
  if (!open) { a.classList.add('open'); ar.classList.add('open'); }
}

document.addEventListener('DOMContentLoaded', () => {
  calcFree();
  calcMcap();
  updateReceive();
  fetchHypePrice();
  setInterval(fetchHypePrice, 30000);
});
