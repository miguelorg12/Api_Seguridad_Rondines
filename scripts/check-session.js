const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de sesiones...\n');

// Verificar variables de entorno relacionadas con sesiones
console.log('📋 Variables de entorno de sesión:');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'definido' : 'no definido');
console.log('NODE_ENV:', process.env.NODE_ENV || 'no definido');

// Verificar archivos importantes
console.log('\n📁 Verificando archivos:');
const filesToCheck = [
  '.env',
  'dist/app.js',
  'dist/server.js',
  'package.json'
];

filesToCheck.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${file}: ${exists ? '✅ existe' : '❌ no existe'}`);
});

// Verificar directorios
console.log('\n📂 Verificando directorios:');
const dirsToCheck = [
  'dist',
  'dist/views',
  'dist/public',
  'node_modules'
];

dirsToCheck.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`${dir}: ${exists ? '✅ existe' : '❌ no existe'}`);
});

// Verificar configuración de PM2
console.log('\n⚙️ Verificando configuración de PM2:');
try {
  const ecosystemPath = path.join(process.cwd(), 'ecosystem.config.js');
  if (fs.existsSync(ecosystemPath)) {
    console.log('ecosystem.config.js: ✅ existe');
    const ecosystem = require(ecosystemPath);
    console.log('Configuración PM2:', JSON.stringify(ecosystem, null, 2));
  } else {
    console.log('ecosystem.config.js: ❌ no existe');
  }
} catch (error) {
  console.log('❌ Error leyendo ecosystem.config.js:', error.message);
}

// Verificar archivo .env
console.log('\n🔐 Verificando archivo .env:');
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasSessionSecret = envContent.includes('SESSION_SECRET');
    const hasJwtSecret = envContent.includes('JWT_SECRET');
    console.log('SESSION_SECRET en .env:', hasSessionSecret ? '✅ presente' : '❌ ausente');
    console.log('JWT_SECRET en .env:', hasJwtSecret ? '✅ presente' : '❌ ausente');
  } catch (error) {
    console.log('❌ Error leyendo .env:', error.message);
  }
} else {
  console.log('.env: ❌ no existe');
}

console.log('\n🔍 Verificación completada.'); 