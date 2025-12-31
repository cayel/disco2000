/**
 * Générateur d'icônes PWA pour Disco2000
 * Ce script crée des icônes SVG avec un design de vinyle
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Template SVG avec design de vinyle/disque
const createSVG = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="vinyl" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#1e1e1e;stop-opacity:1" />
      <stop offset="40%" style="stop-color:#0a0a0a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
    </radialGradient>
  </defs>
  
  <!-- Fond -->
  <rect width="512" height="512" rx="110" fill="url(#bg)"/>
  
  <!-- Disque vinyle -->
  <circle cx="256" cy="256" r="180" fill="url(#vinyl)"/>
  
  <!-- Anneaux du vinyle -->
  <circle cx="256" cy="256" r="170" fill="none" stroke="#1a1a1a" stroke-width="2" opacity="0.5"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="#1a1a1a" stroke-width="1" opacity="0.3"/>
  <circle cx="256" cy="256" r="130" fill="none" stroke="#1a1a1a" stroke-width="1" opacity="0.3"/>
  <circle cx="256" cy="256" r="110" fill="none" stroke="#1a1a1a" stroke-width="1" opacity="0.3"/>
  
  <!-- Label central -->
  <circle cx="256" cy="256" r="70" fill="#8b5cf6"/>
  <circle cx="256" cy="256" r="65" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.3"/>
  
  <!-- Trou central -->
  <circle cx="256" cy="256" r="20" fill="#0f172a"/>
  
  <!-- Reflets -->
  <path d="M 180 200 Q 256 180 332 200" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.2"/>
  <path d="M 200 240 Q 256 230 312 240" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.15"/>
  
  <!-- Texte "D2K" stylisé -->
  <text x="256" y="275" font-family="Montserrat, Arial, sans-serif" font-size="48" font-weight="900" fill="#ffffff" text-anchor="middle" opacity="0.9">D2K</text>
</svg>`;

// Créer le dossier icons s'il n'existe pas
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Générer les icônes
sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✅ Créé: ${filename}`);
});

console.log('\n📱 Icônes SVG générées avec succès!');
console.log('💡 Pour de meilleures performances, convertir en PNG avec un outil comme ImageMagick:');
console.log('   convert icon-192x192.svg icon-192x192.png');
