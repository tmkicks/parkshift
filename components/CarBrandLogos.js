// Real car brand logos using CarLogos API
const carLogosAPI = {
  baseUrl: 'https://carlogos.org/car-logos/',
  brands: {
    // German Brands
    'BMW': 'bmw-logo.png',
    'Mercedes-Benz': 'mercedes-benz-logo.png',
    'Mercedes': 'mercedes-benz-logo.png',
    'Audi': 'audi-logo.png',
    'Volkswagen': 'volkswagen-logo.png',
    'VW': 'volkswagen-logo.png',
    'Porsche': 'porsche-logo.png',
    'Opel': 'opel-logo.png',
    
    // Japanese Brands
    'Toyota': 'toyota-logo.png',
    'Honda': 'honda-logo.png',
    'Nissan': 'nissan-logo.png',
    'Mazda': 'mazda-logo.png',
    'Subaru': 'subaru-logo.png',
    'Lexus': 'lexus-logo.png',
    'Infiniti': 'infiniti-logo.png',
    'Mitsubishi': 'mitsubishi-logo.png',
    'Suzuki': 'suzuki-logo.png',
    'Acura': 'acura-logo.png',
    
    // American Brands
    'Ford': 'ford-logo.png',
    'Chevrolet': 'chevrolet-logo.png',
    'Tesla': 'tesla-logo.png',
    'Cadillac': 'cadillac-logo.png',
    'Lincoln': 'lincoln-logo.png',
    'Jeep': 'jeep-logo.png',
    'Dodge': 'dodge-logo.png',
    'Chrysler': 'chrysler-logo.png',
    'Buick': 'buick-logo.png',
    'GMC': 'gmc-logo.png',
    
    // French Brands
    'Peugeot': 'peugeot-logo.png',
    'Renault': 'renault-logo.png',
    'Citroën': 'citroen-logo.png',
    'Citroen': 'citroen-logo.png',
    
    // Italian Brands
    'Fiat': 'fiat-logo.png',
    'Alfa Romeo': 'alfa-romeo-logo.png',
    'Ferrari': 'ferrari-logo.png',
    'Lamborghini': 'lamborghini-logo.png',
    'Maserati': 'maserati-logo.png',
    
    // British Brands
    'Land Rover': 'land-rover-logo.png',
    'Jaguar': 'jaguar-logo.png',
    'Mini': 'mini-logo.png',
    'Rolls-Royce': 'rolls-royce-logo.png',
    'Bentley': 'bentley-logo.png',
    'Aston Martin': 'aston-martin-logo.png',
    
    // Other European
    'Volvo': 'volvo-logo.png',
    'SEAT': 'seat-logo.png',
    'Skoda': 'skoda-logo.png',
    'Škoda': 'skoda-logo.png',
    
    // Korean Brands
    'Hyundai': 'hyundai-logo.png',
    'Kia': 'kia-logo.png',
    'Genesis': 'genesis-logo.png'
  }
};

export const CarBrandLogo = ({ make, className = "w-8 h-8" }) => {
  const logoFileName = carLogosAPI.brands[make];
  
  if (logoFileName) {
    const logoUrl = `${carLogosAPI.baseUrl}${logoFileName}`;
    
    return (
      <div className={className}>
        <img 
          src={logoUrl}
          alt={`${make} logo`}
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to generic car icon if logo fails to load
            e.target.style.display = 'none';
            const fallback = e.target.parentNode.querySelector('.fallback-icon');
            if (fallback) {
              fallback.style.display = 'flex';
            }
          }}
        />
        <div 
          className="fallback-icon w-full h-full flex items-center justify-center bg-gray-200 rounded text-gray-600 text-lg"
          style={{ display: 'none' }}
        >
          🚗
        </div>
      </div>
    );
  }
  
  // Fallback for unknown brands
  return (
    <div className={`${className} flex items-center justify-center bg-gray-200 rounded text-gray-600 text-lg`}>
      🚗
    </div>
  );
};