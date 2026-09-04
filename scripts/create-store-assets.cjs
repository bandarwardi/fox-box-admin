const fs = require('fs');
const path = require('path');

const storeDirAdmin = path.resolve(__dirname, '../public/assets/store');
const storeDirApp = path.resolve(__dirname, '../../app/artifacts/streamzone/assets/images/store');
const giftsDir = path.resolve(__dirname, '../public/assets/gifts');

[storeDirAdmin, storeDirApp].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

function saveAsset(filename, content) {
  fs.writeFileSync(path.join(storeDirAdmin, filename), content);
  fs.writeFileSync(path.join(storeDirApp, filename), content);
  console.log('Saved:', filename);
}

// 1. Royal Gold Frame SVG
const frameRoyalGold = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF3B0" />
      <stop offset="35%" stop-color="#FFD700" />
      <stop offset="70%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#AA771C" />
    </linearGradient>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <circle cx="100" cy="100" r="90" fill="none" stroke="url(#goldGrad)" stroke-width="8" filter="url(#goldGlow)" />
  <circle cx="100" cy="100" r="84" fill="none" stroke="#FFF" stroke-width="1.5" stroke-opacity="0.8" />
  <circle cx="100" cy="100" r="96" fill="none" stroke="#FFD700" stroke-width="1" stroke-dasharray="4 6" />
  <g transform="translate(75, 8) scale(1)">
    <path d="M5,25 L12,12 L25,20 L38,12 L45,25 L40,30 L10,30 Z" fill="url(#goldGrad)" stroke="#FFF" stroke-width="1" filter="url(#goldGlow)" />
    <circle cx="12" cy="11" r="2.5" fill="#FFF" />
    <circle cx="25" cy="19" r="3" fill="#E53935" />
    <circle cx="38" cy="11" r="2.5" fill="#FFF" />
  </g>
  <polygon points="100,188 102,193 107,195 102,197 100,202 98,197 93,195 98,193" fill="#FFF" />
</svg>`;

// 2. Cyber Neon Frame SVG
const frameCyberNeon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE" />
      <stop offset="50%" stop-color="#4FACFE" />
      <stop offset="100%" stop-color="#FF0844" />
    </linearGradient>
    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <circle cx="100" cy="100" r="90" fill="none" stroke="url(#neonGrad)" stroke-width="7" filter="url(#neonGlow)" />
  <circle cx="100" cy="100" r="85" fill="none" stroke="#00F2FE" stroke-width="2" stroke-dasharray="14 6" />
  <circle cx="100" cy="100" r="95" fill="none" stroke="#FF0844" stroke-width="1.5" stroke-dasharray="6 8" />
  <circle cx="100" cy="10" r="4" fill="#00F2FE" filter="url(#neonGlow)" />
  <circle cx="100" cy="190" r="4" fill="#FF0844" filter="url(#neonGlow)" />
  <circle cx="10" cy="100" r="4" fill="#4FACFE" filter="url(#neonGlow)" />
  <circle cx="190" cy="100" r="4" fill="#FF0844" filter="url(#neonGlow)" />
</svg>`;

// 3. Blazing Flame Frame SVG
const frameBlazingFlame = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="fireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#FF1744" />
      <stop offset="40%" stop-color="#FF6D00" />
      <stop offset="75%" stop-color="#FFD600" />
      <stop offset="100%" stop-color="#FFFFFF" />
    </linearGradient>
    <filter id="fireGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <circle cx="100" cy="100" r="90" fill="none" stroke="url(#fireGrad)" stroke-width="8" filter="url(#fireGlow)" />
  <circle cx="100" cy="100" r="83" fill="none" stroke="#FFD600" stroke-width="2" />
  <path d="M92,15 Q100,0 108,15 Q103,10 100,18 Q97,10 92,15 Z" fill="url(#fireGrad)" filter="url(#fireGlow)" />
  <path d="M70,22 Q75,12 82,23 Q78,18 75,26 Z" fill="url(#fireGrad)" />
  <path d="M120,23 Q125,12 130,22 Q126,18 123,26 Z" fill="url(#fireGrad)" />
</svg>`;

// 4. Diamond Crystal Frame SVG
const frameDiamondCrystal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="diaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0F7FA" />
      <stop offset="40%" stop-color="#80DEEA" />
      <stop offset="80%" stop-color="#26C6DA" />
      <stop offset="100%" stop-color="#00ACC1" />
    </linearGradient>
    <filter id="diaGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <circle cx="100" cy="100" r="90" fill="none" stroke="url(#diaGrad)" stroke-width="8" filter="url(#diaGlow)" />
  <circle cx="100" cy="100" r="83" fill="none" stroke="#FFF" stroke-width="2" stroke-dasharray="16 8" />
  <polygon points="100,10 115,22 85,22" fill="#E0F7FA" stroke="#FFF" stroke-width="1" filter="url(#diaGlow)" />
  <polygon points="85,22 115,22 100,32" fill="#26C6DA" stroke="#FFF" stroke-width="1" />
</svg>`;

// 5. Sakura Blossom Frame SVG
const frameSakuraBlossom = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="sakuraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE4E8" />
      <stop offset="50%" stop-color="#FF8DA1" />
      <stop offset="100%" stop-color="#E91E63" />
    </linearGradient>
    <filter id="sakuraGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <circle cx="100" cy="100" r="90" fill="none" stroke="url(#sakuraGrad)" stroke-width="7" filter="url(#sakuraGlow)" />
  <circle cx="100" cy="100" r="84" fill="none" stroke="#FFF" stroke-width="1.5" />
  <circle cx="100" cy="12" r="6" fill="#FF8DA1" filter="url(#sakuraGlow)" />
  <circle cx="94" cy="16" r="5" fill="#FFAEC0" />
  <circle cx="106" cy="16" r="5" fill="#FFAEC0" />
  <circle cx="96" cy="22" r="5" fill="#FFAEC0" />
  <circle cx="104" cy="22" r="5" fill="#FFAEC0" />
  <circle cx="100" cy="17" r="2.5" fill="#FFD700" />
</svg>`;

// 6. Cosmic Galaxy Frame SVG
const frameCosmicGalaxy = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="galaxyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C471ED" />
      <stop offset="50%" stop-color="#12C2E9" />
      <stop offset="100%" stop-color="#F64F59" />
    </linearGradient>
    <filter id="galaxyGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <circle cx="100" cy="100" r="90" fill="none" stroke="url(#galaxyGrad)" stroke-width="8" filter="url(#galaxyGlow)" />
  <circle cx="100" cy="100" r="84" fill="none" stroke="#FFF" stroke-width="1.5" stroke-dasharray="10 12" />
  <polygon points="100,8 102,14 108,16 102,18 100,24 98,18 92,16 98,14" fill="#FFF" filter="url(#galaxyGlow)" />
  <circle cx="40" cy="40" r="2" fill="#FFF" />
  <circle cx="160" cy="40" r="2" fill="#FFF" />
  <circle cx="30" cy="120" r="2.5" fill="#12C2E9" />
</svg>`;

// Save frames
saveAsset('frame_royal_gold.svg', frameRoyalGold);
saveAsset('frame_cyber_neon.svg', frameCyberNeon);
saveAsset('frame_blazing_flame.svg', frameBlazingFlame);
saveAsset('frame_diamond_crystal.svg', frameDiamondCrystal);
saveAsset('frame_sakura_blossom.svg', frameSakuraBlossom);
saveAsset('frame_cosmic_galaxy.svg', frameCosmicGalaxy);

// 13. Gold VIP Chat Bubble SVG
const bubbleGoldVip = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140" width="240" height="140">
  <defs>
    <linearGradient id="bgGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D2100" />
      <stop offset="100%" stop-color="#140F00" />
    </linearGradient>
    <linearGradient id="borderGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF3B0" />
      <stop offset="50%" stop-color="#FFD700" />
      <stop offset="100%" stop-color="#D4AF37" />
    </linearGradient>
    <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#FFD700" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect x="8" y="8" width="224" height="104" rx="20" fill="url(#bgGold)" stroke="url(#borderGold)" stroke-width="3" filter="url(#glow)"/>
  <path d="M40,112 L30,130 L55,112 Z" fill="#140F00" stroke="url(#borderGold)" stroke-width="2"/>
  <path d="M30,32 L35,24 L42,28 L49,24 L54,32 Z" fill="url(#borderGold)"/>
  <text x="65" y="32" fill="#FFD700" font-size="14" font-weight="bold" font-family="sans-serif">VIP GOLD</text>
  <rect x="30" y="48" width="160" height="8" rx="4" fill="#FFD700" fill-opacity="0.8"/>
  <rect x="30" y="66" width="110" height="8" rx="4" fill="#FFD700" fill-opacity="0.5"/>
</svg>`;

// 14. Neon Cyber Chat Bubble SVG
const bubbleNeonCyber = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140" width="240" height="140">
  <defs>
    <linearGradient id="bgCyber" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001824" />
      <stop offset="100%" stop-color="#000910" />
    </linearGradient>
    <linearGradient id="borderCyber" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE" />
      <stop offset="100%" stop-color="#4FACFE" />
    </linearGradient>
    <filter id="cyberGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#00F2FE" flood-opacity="0.5"/>
    </filter>
  </defs>
  <rect x="8" y="8" width="224" height="104" rx="20" fill="url(#bgCyber)" stroke="url(#borderCyber)" stroke-width="3" filter="url(#cyberGlow)"/>
  <path d="M40,112 L30,130 L55,112 Z" fill="#000910" stroke="url(#borderCyber)" stroke-width="2"/>
  <circle cx="35" cy="28" r="5" fill="#00F2FE"/>
  <text x="50" y="32" fill="#00F2FE" font-size="14" font-weight="bold" font-family="sans-serif">CYBER NEON</text>
  <rect x="30" y="48" width="160" height="8" rx="4" fill="#00F2FE" fill-opacity="0.8"/>
  <rect x="30" y="66" width="120" height="8" rx="4" fill="#00F2FE" fill-opacity="0.5"/>
</svg>`;

// 15. Fire Flame Chat Bubble SVG
const bubbleFireFlame = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140" width="240" height="140">
  <defs>
    <linearGradient id="bgFire" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D0600" />
      <stop offset="100%" stop-color="#140200" />
    </linearGradient>
    <linearGradient id="borderFire" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFD600" />
      <stop offset="50%" stop-color="#FF6D00" />
      <stop offset="100%" stop-color="#FF1744" />
    </linearGradient>
    <filter id="fireBubbleGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#FF6D00" flood-opacity="0.5"/>
    </filter>
  </defs>
  <rect x="8" y="8" width="224" height="104" rx="20" fill="url(#bgFire)" stroke="url(#borderFire)" stroke-width="3" filter="url(#fireBubbleGlow)"/>
  <path d="M40,112 L30,130 L55,112 Z" fill="#140200" stroke="url(#borderFire)" stroke-width="2"/>
  <text x="30" y="33" fill="#FF9100" font-size="14" font-weight="bold" font-family="sans-serif">🔥 BLAZING FIRE</text>
  <rect x="30" y="48" width="150" height="8" rx="4" fill="#FF9100" fill-opacity="0.8"/>
  <rect x="30" y="66" width="100" height="8" rx="4" fill="#FF9100" fill-opacity="0.5"/>
</svg>`;

// 16. Romantic Love Chat Bubble SVG
const bubbleRomanticLove = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140" width="240" height="140">
  <defs>
    <linearGradient id="bgPink" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#280012" />
      <stop offset="100%" stop-color="#100007" />
    </linearGradient>
    <linearGradient id="borderPink" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF8DA1" />
      <stop offset="100%" stop-color="#E91E63" />
    </linearGradient>
    <filter id="pinkGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#E91E63" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect x="8" y="8" width="224" height="104" rx="20" fill="url(#bgPink)" stroke="url(#borderPink)" stroke-width="3" filter="url(#pinkGlow)"/>
  <path d="M40,112 L30,130 L55,112 Z" fill="#100007" stroke="url(#borderPink)" stroke-width="2"/>
  <text x="30" y="33" fill="#FF8DA1" font-size="14" font-weight="bold" font-family="sans-serif">💖 SWEET LOVE</text>
  <rect x="30" y="48" width="160" height="8" rx="4" fill="#FF8DA1" fill-opacity="0.8"/>
  <rect x="30" y="66" width="115" height="8" rx="4" fill="#FF8DA1" fill-opacity="0.5"/>
</svg>`;

// 17. Cosmic Purple Chat Bubble SVG
const bubbleCosmicPurple = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140" width="240" height="140">
  <defs>
    <linearGradient id="bgCosmic" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18002E" />
      <stop offset="100%" stop-color="#0A0014" />
    </linearGradient>
    <linearGradient id="borderCosmic" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C471ED" />
      <stop offset="100%" stop-color="#7B1FA2" />
    </linearGradient>
    <filter id="cosmicGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#C471ED" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect x="8" y="8" width="224" height="104" rx="20" fill="url(#bgCosmic)" stroke="url(#borderCosmic)" stroke-width="3" filter="url(#cosmicGlow)"/>
  <path d="M40,112 L30,130 L55,112 Z" fill="#0A0014" stroke="url(#borderCosmic)" stroke-width="2"/>
  <text x="30" y="33" fill="#E1BEE7" font-size="14" font-weight="bold" font-family="sans-serif">✨ GALAXY NEBULA</text>
  <rect x="30" y="48" width="160" height="8" rx="4" fill="#E1BEE7" fill-opacity="0.8"/>
  <rect x="30" y="66" width="120" height="8" rx="4" fill="#E1BEE7" fill-opacity="0.5"/>
</svg>`;

// Save bubbles
saveAsset('bubble_gold_vip.svg', bubbleGoldVip);
saveAsset('bubble_neon_cyber.svg', bubbleNeonCyber);
saveAsset('bubble_fire_flame.svg', bubbleFireFlame);
saveAsset('bubble_romantic_love.svg', bubbleRomanticLove);
saveAsset('bubble_cosmic_purple.svg', bubbleCosmicPurple);

// Copy 3D Entry effects
fs.copyFileSync(path.join(giftsDir, 'supercar.png'), path.join(storeDirAdmin, 'entry_supercar.png'));
fs.copyFileSync(path.join(giftsDir, 'supercar.png'), path.join(storeDirApp, 'entry_supercar.png'));

fs.copyFileSync(path.join(giftsDir, 'rocket.png'), path.join(storeDirAdmin, 'entry_rocket.png'));
fs.copyFileSync(path.join(giftsDir, 'rocket.png'), path.join(storeDirApp, 'entry_rocket.png'));

fs.copyFileSync(path.join(giftsDir, 'airplane.png'), path.join(storeDirAdmin, 'entry_jet.png'));
fs.copyFileSync(path.join(giftsDir, 'airplane.png'), path.join(storeDirApp, 'entry_jet.png'));

fs.copyFileSync(path.join(giftsDir, 'dragon.png'), path.join(storeDirAdmin, 'entry_dragon.png'));
fs.copyFileSync(path.join(giftsDir, 'dragon.png'), path.join(storeDirApp, 'entry_dragon.png'));

console.log('Copied entry effects!');

// Download Helicopter and Comet
async function downloadRemote(url, filename) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(path.join(storeDirAdmin, filename), Buffer.from(buf));
  fs.writeFileSync(path.join(storeDirApp, filename), Buffer.from(buf));
  console.log('Downloaded:', filename);
}

Promise.all([
  downloadRemote('https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Helicopter/3D/helicopter_3d.png', 'entry_helicopter.png'),
  downloadRemote('https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Comet/3D/comet_3d.png', 'entry_comet.png')
]).then(() => {
  console.log('🎉 ALL STORE ASSETS CREATED SUCCESSFULLY!');
}).catch(e => console.error('Download error:', e));
