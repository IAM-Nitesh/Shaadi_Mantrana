#!/usr/bin/env node

/**
 * Figma Design Token Extraction Script
 * 
 * This script helps extract design tokens from Figma files
 * and convert them to CSS custom properties for the design system.
 * 
 * Usage:
 * 1. Export design tokens from Figma (Design System > Export)
 * 2. Save the JSON file as 'figma-tokens.json'
 * 3. Run: node scripts/extract-figma-tokens.js
 */

const fs = require('fs');
const path = require('path');

// Figma token structure (example)
const figmaTokens = {
  colors: {
    primary: {
      50: { value: '#fdf2f8', type: 'color' },
      100: { value: '#fce7f3', type: 'color' },
      200: { value: '#fbcfe8', type: 'color' },
      300: { value: '#f9a8d4', type: 'color' },
      400: { value: '#f472b6', type: 'color' },
      500: { value: '#ec4899', type: 'color' },
      600: { value: '#db2777', type: 'color' },
      700: { value: '#be185d', type: 'color' },
      800: { value: '#9d174d', type: 'color' },
      900: { value: '#831843', type: 'color' }
    },
    secondary: {
      50: { value: '#fff1f2', type: 'color' },
      100: { value: '#ffe4e6', type: 'color' },
      500: { value: '#f43f5e', type: 'color' },
      600: { value: '#e11d48', type: 'color' }
    },
    neutral: {
      0: { value: '#ffffff', type: 'color' },
      50: { value: '#fafafa', type: 'color' },
      100: { value: '#f5f5f5', type: 'color' },
      200: { value: '#e5e5e5', type: 'color' },
      300: { value: '#d4d4d4', type: 'color' },
      400: { value: '#a3a3a3', type: 'color' },
      500: { value: '#737373', type: 'color' },
      600: { value: '#525252', type: 'color' },
      700: { value: '#404040', type: 'color' },
      800: { value: '#262626', type: 'color' },
      900: { value: '#171717', type: 'color' }
    }
  },
  typography: {
    fontSizes: {
      xs: { value: '0.75rem', type: 'fontSize' },
      sm: { value: '0.875rem', type: 'fontSize' },
      base: { value: '1rem', type: 'fontSize' },
      lg: { value: '1.125rem', type: 'fontSize' },
      xl: { value: '1.25rem', type: 'fontSize' },
      '2xl': { value: '1.5rem', type: 'fontSize' },
      '3xl': { value: '1.875rem', type: 'fontSize' },
      '4xl': { value: '2.25rem', type: 'fontSize' },
      '5xl': { value: '3rem', type: 'fontSize' },
      '6xl': { value: '3.75rem', type: 'fontSize' }
    },
    fontWeights: {
      thin: { value: '100', type: 'fontWeight' },
      extralight: { value: '200', type: 'fontWeight' },
      light: { value: '300', type: 'fontWeight' },
      normal: { value: '400', type: 'fontWeight' },
      medium: { value: '500', type: 'fontWeight' },
      semibold: { value: '600', type: 'fontWeight' },
      bold: { value: '700', type: 'fontWeight' },
      extrabold: { value: '800', type: 'fontWeight' },
      black: { value: '900', type: 'fontWeight' }
    },
    lineHeights: {
      tight: { value: '1.25', type: 'lineHeight' },
      snug: { value: '1.375', type: 'lineHeight' },
      normal: { value: '1.5', type: 'lineHeight' },
      relaxed: { value: '1.625', type: 'lineHeight' },
      loose: { value: '2', type: 'lineHeight' }
    }
  },
  spacing: {
    '0': { value: '0', type: 'spacing' },
    '1': { value: '0.25rem', type: 'spacing' },
    '2': { value: '0.5rem', type: 'spacing' },
    '3': { value: '0.75rem', type: 'spacing' },
    '4': { value: '1rem', type: 'spacing' },
    '5': { value: '1.25rem', type: 'spacing' },
    '6': { value: '1.5rem', type: 'spacing' },
    '8': { value: '2rem', type: 'spacing' },
    '10': { value: '2.5rem', type: 'spacing' },
    '12': { value: '3rem', type: 'spacing' },
    '16': { value: '4rem', type: 'spacing' },
    '20': { value: '5rem', type: 'spacing' },
    '24': { value: '6rem', type: 'spacing' },
    '32': { value: '8rem', type: 'spacing' }
  },
  borderRadius: {
    none: { value: '0', type: 'borderRadius' },
    sm: { value: '0.125rem', type: 'borderRadius' },
    base: { value: '0.25rem', type: 'borderRadius' },
    md: { value: '0.375rem', type: 'borderRadius' },
    lg: { value: '0.5rem', type: 'borderRadius' },
    xl: { value: '0.75rem', type: 'borderRadius' },
    '2xl': { value: '1rem', type: 'borderRadius' },
    '3xl': { value: '1.5rem', type: 'borderRadius' },
    full: { value: '9999px', type: 'borderRadius' }
  },
  shadows: {
    xs: { value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', type: 'boxShadow' },
    sm: { value: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', type: 'boxShadow' },
    md: { value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', type: 'boxShadow' },
    lg: { value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', type: 'boxShadow' },
    xl: { value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', type: 'boxShadow' },
    '2xl': { value: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', type: 'boxShadow' }
  }
};

/**
 * Convert kebab-case to camelCase
 */
function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Generate CSS custom properties from Figma tokens
 */
function generateCSSVariables(tokens, prefix = '') {
  let css = '';
  
  Object.entries(tokens).forEach(([key, value]) => {
    if (value && typeof value === 'object' && value.value !== undefined) {
      // It's a token with a value
      const varName = prefix ? `${prefix}-${key}` : key;
      css += `  --${varName}: ${value.value};\n`;
    } else if (value && typeof value === 'object') {
      // It's a nested object, recurse
      const newPrefix = prefix ? `${prefix}-${key}` : key;
      css += generateCSSVariables(value, newPrefix);
    }
  });
  
  return css;
}

/**
 * Generate TypeScript interfaces from Figma tokens
 */
function generateTypeScriptTypes(tokens, interfaceName = 'DesignTokens') {
  let ts = `export interface ${interfaceName} {\n`;
  
  Object.entries(tokens).forEach(([key, value]) => {
    if (value && typeof value === 'object' && value.value !== undefined) {
      // It's a token with a value
      const type = value.type || 'string';
      ts += `  ${key}: ${type};\n`;
    } else if (value && typeof value === 'object') {
      // It's a nested object
      const nestedInterfaceName = `${interfaceName}${key.charAt(0).toUpperCase() + key.slice(1)}`;
      ts += `  ${key}: ${nestedInterfaceName};\n`;
      // Generate nested interface (simplified)
      ts += `}\n\nexport interface ${nestedInterfaceName} {\n`;
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        const nestedType = nestedValue.type || 'string';
        ts += `  ${nestedKey}: ${nestedType};\n`;
      });
      ts += `}\n\nexport interface ${interfaceName} {\n`;
    }
  });
  
  ts += '}\n';
  return ts;
}

/**
 * Generate Tailwind config from Figma tokens
 */
function generateTailwindConfig(tokens) {
  const config = {
    theme: {
      extend: {
        colors: {},
        fontSize: {},
        fontWeight: {},
        lineHeight: {},
        spacing: {},
        borderRadius: {},
        boxShadow: {}
      }
    }
  };
  
  // Colors
  if (tokens.colors) {
    Object.entries(tokens.colors).forEach(([colorName, colorValues]) => {
      config.theme.extend.colors[colorName] = {};
      Object.entries(colorValues).forEach(([shade, token]) => {
        config.theme.extend.colors[colorName][shade] = token.value;
      });
    });
  }
  
  // Typography
  if (tokens.typography) {
    if (tokens.typography.fontSizes) {
      Object.entries(tokens.typography.fontSizes).forEach(([size, token]) => {
        config.theme.extend.fontSize[size] = token.value;
      });
    }
    
    if (tokens.typography.fontWeights) {
      Object.entries(tokens.typography.fontWeights).forEach(([weight, token]) => {
        config.theme.extend.fontWeight[weight] = token.value;
      });
    }
    
    if (tokens.typography.lineHeights) {
      Object.entries(tokens.typography.lineHeights).forEach(([height, token]) => {
        config.theme.extend.lineHeight[height] = token.value;
      });
    }
  }
  
  // Spacing
  if (tokens.spacing) {
    Object.entries(tokens.spacing).forEach(([space, token]) => {
      config.theme.extend.spacing[space] = token.value;
    });
  }
  
  // Border Radius
  if (tokens.borderRadius) {
    Object.entries(tokens.borderRadius).forEach(([radius, token]) => {
      config.theme.extend.borderRadius[radius] = token.value;
    });
  }
  
  // Shadows
  if (tokens.shadows) {
    Object.entries(tokens.shadows).forEach(([shadow, token]) => {
      config.theme.extend.boxShadow[shadow] = token.value;
    });
  }
  
  return config;
}

/**
 * Main execution function
 */
function main() {
  console.log('🎨 Extracting Figma Design Tokens...\n');
  
  try {
    // Try to load actual Figma tokens file
    const tokensPath = path.join(__dirname, '..', 'figma-tokens.json');
    let tokens = figmaTokens; // Default to example tokens
    
    if (fs.existsSync(tokensPath)) {
      console.log('📁 Loading Figma tokens from file...');
      const fileContent = fs.readFileSync(tokensPath, 'utf8');
      tokens = JSON.parse(fileContent);
      console.log('✅ Figma tokens loaded successfully!\n');
    } else {
      console.log('⚠️  No figma-tokens.json found, using example tokens\n');
      console.log('📋 To extract real tokens:');
      console.log('   1. Go to your Figma file');
      console.log('   2. Open Design System > Export');
      console.log('   3. Save as JSON');
      console.log('   4. Place in frontend/figma-tokens.json\n');
    }
    
    // Generate CSS variables
    console.log('🎯 Generating CSS custom properties...');
    const cssVariables = `/* Design Tokens from Figma */
:root {
${generateCSSVariables(tokens)}
}`;
    
    const cssPath = path.join(__dirname, '..', 'src', 'styles', 'figma-tokens.css');
    fs.writeFileSync(cssPath, cssVariables);
    console.log(`✅ CSS variables written to: ${cssPath}`);
    
    // Generate TypeScript types
    console.log('🎯 Generating TypeScript types...');
    const tsTypes = generateTypeScriptTypes(tokens);
    const tsPath = path.join(__dirname, '..', 'src', 'types', 'figma-tokens.ts');
    fs.writeFileSync(tsPath, tsTypes);
    console.log(`✅ TypeScript types written to: ${tsPath}`);
    
    // Generate Tailwind config
    console.log('🎯 Generating Tailwind config...');
    const tailwindConfig = generateTailwindConfig(tokens);
    const tailwindPath = path.join(__dirname, '..', 'tailwind.figma.config.js');
    fs.writeFileSync(tailwindPath, `module.exports = ${JSON.stringify(tailwindConfig, null, 2)};`);
    console.log(`✅ Tailwind config written to: ${tailwindPath}`);
    
    console.log('\n🎉 Design token extraction complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Review generated files');
    console.log('   2. Merge with existing design system');
    console.log('   3. Test components with new tokens');
    console.log('   4. Update documentation');
    
  } catch (error) {
    console.error('❌ Error extracting design tokens:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateCSSVariables,
  generateTypeScriptTypes,
  generateTailwindConfig
};

