// Car brand logos and vehicle type detection utilities

export const getCarBrandLogo = (make) => {
  const brandLogos = {
    // German Brands
    'BMW': '🔵',
    'Mercedes-Benz': '⭐',
    'Mercedes': '⭐',
    'Audi': '🔲',
    'Volkswagen': '🔘',
    'VW': '🔘',
    'Porsche': '🏆',
    
    // Japanese Brands  
    'Toyota': '🔴',
    'Honda': '🔳',
    'Nissan': '⚫',
    'Mazda': '🌀',
    'Subaru': '💫',
    'Lexus': '💎',
    
    // American Brands
    'Ford': '🔷',
    'Chevrolet': '🌟',
    'Tesla': '⚡',
    'Cadillac': '👑',
    
    // French Brands
    'Peugeot': '🦁',
    'Renault': '💎',
    'Citroën': '🔻',
    
    // Other European
    'Volvo': '🛡️',
    'SEAT': '🔺',
    'Skoda': '🔷',
    'Fiat': '🔴',
    'Alfa Romeo': '🐍'
  };
  
  return brandLogos[make] || '🚗';
};

export const getVehicleType = (make, model) => {
  const model_lower = model.toLowerCase();
  
  // SUV/Crossover patterns
  if (model_lower.includes('x') && /[0-9]/.test(model_lower)) return 'suv'; // BMW X5, etc.
  if (model_lower.includes('suv') || model_lower.includes('crossover')) return 'suv';
  if (['rav4', 'cr-v', 'forester', 'outback', 'q5', 'glc', 'x-trail'].some(suv => model_lower.includes(suv))) return 'suv';
  
  // Coupe patterns
  if (model_lower.includes('coupe') || model_lower.includes('coupé')) return 'coupe';
  if (['gt', 'z4', 'slk', 'tt'].some(coupe => model_lower.includes(coupe))) return 'coupe';
  
  // Hatchback patterns
  if (['golf', 'polo', 'fiesta', 'focus', 'civic', 'corolla', 'yaris', 'clio'].some(hatch => model_lower.includes(hatch))) return 'hatchback';
  
  // Default to sedan
  return 'sedan';
};

export const getCarSilhouette = (vehicleType) => {
  const silhouettes = {
    sedan: '🚗',
    suv: '🚙', 
    hatchback: '🚗',
    coupe: '🏎️',
    truck: '🚚',
    van: '🚐'
  };
  
  return silhouettes[vehicleType] || '🚗';
};

// License plate country formats
export const getLicensePlateFormat = (country) => {
  const plateFormats = {
    'BE': { 
      bg: 'bg-white', 
      text: 'text-red-600', 
      border: 'border-red-600', 
      flag: '🇧🇪',
      flagBg: 'bg-blue-600',
      name: 'Belgium'
    },
    'DE': { 
      bg: 'bg-white', 
      text: 'text-black', 
      border: 'border-black', 
      flag: '🇩🇪',
      flagBg: 'bg-black',
      name: 'Germany'
    },
    'NL': { 
      bg: 'bg-yellow-300', 
      text: 'text-black', 
      border: 'border-black', 
      flag: '🇳🇱',
      flagBg: 'bg-orange-500',
      name: 'Netherlands'
    },
    'FR': { 
      bg: 'bg-white', 
      text: 'text-black', 
      border: 'border-black', 
      flag: '🇫🇷',
      flagBg: 'bg-blue-600',
      name: 'France'
    },
    'UK': { 
      bg: 'bg-white', 
      text: 'text-black', 
      border: 'border-black', 
      flag: '🇬🇧',
      flagBg: 'bg-blue-600',
      name: 'United Kingdom'
    },
    'IT': { 
      bg: 'bg-white', 
      text: 'text-black', 
      border: 'border-black', 
      flag: '🇮🇹',
      flagBg: 'bg-green-600',
      name: 'Italy'
    },
    'ES': { 
      bg: 'bg-white', 
      text: 'text-black', 
      border: 'border-black', 
      flag: '🇪🇸',
      flagBg: 'bg-red-600',
      name: 'Spain'
    }
  };

  return plateFormats[country] || plateFormats['BE'];
};