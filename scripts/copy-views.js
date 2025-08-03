const fs = require('fs');
const path = require('path');

const sourceViewsDir = path.join(__dirname, '..', 'src', 'views');
const targetViewsDir = path.join(__dirname, '..', 'dist', 'views');
const sourcePublicDir = path.join(__dirname, '..', 'public');
const targetPublicDir = path.join(__dirname, '..', 'dist', 'public');

// Función para copiar archivos recursivamente
function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied: ${file}`);
    }
  });
}

// Función para copiar un directorio específico
function copySpecificDirectory(source, target, dirName) {
  if (fs.existsSync(source)) {
    copyDirectory(source, target);
    console.log(`${dirName} copied successfully!`);
  } else {
    console.log(`${dirName} directory not found, skipping...`);
  }
}

try {
  // Copiar vistas
  copySpecificDirectory(sourceViewsDir, targetViewsDir, 'Views');
  
  // Copiar archivos públicos
  copySpecificDirectory(sourcePublicDir, targetPublicDir, 'Public files');
  
  console.log('All static files copied successfully!');
} catch (error) {
  console.error('Error copying files:', error);
  process.exit(1);
} 