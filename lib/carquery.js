import axios from 'axios';

const CARQUERY_BASE_URL = 'https://www.carqueryapi.com/api/0.3/';

export const carQueryService = {
  async getMakes() {
    try {
      const response = await axios.get(`${CARQUERY_BASE_URL}?cmd=getMakes`);
      return response.data.Makes || [];
    } catch (error) {
      console.error('Error fetching car makes:', error);
      return [];
    }
  },

  async getModels(makeId, year) {
    try {
      const params = new URLSearchParams({
        cmd: 'getModels',
        make: makeId
      });
      
      if (year) {
        params.append('year', year);
      }

      const response = await axios.get(`${CARQUERY_BASE_URL}?${params}`);
      return response.data.Models || [];
    } catch (error) {
      console.error('Error fetching car models:', error);
      return [];
    }
  },

  async getTrims(makeId, model, year) {
    try {
      const params = new URLSearchParams({
        cmd: 'getTrims',
        make: makeId,
        model: model,
        year: year
      });

      const response = await axios.get(`${CARQUERY_BASE_URL}?${params}`);
      return response.data.Trims || [];
    } catch (error) {
      console.error('Error fetching car trims:', error);
      return [];
    }
  },

  async getVehicleSpecs(makeId, model, year) {
    try {
      const trims = await this.getTrims(makeId, model, year);
      if (trims.length > 0) {
        // Use the first trim as default specifications
        const trim = trims[0];
        return {
          length_mm: trim.model_length_mm ? parseInt(trim.model_length_mm) : null,
          width_mm: trim.model_width_mm ? parseInt(trim.model_width_mm) : null,
          height_mm: trim.model_height_mm ? parseInt(trim.model_height_mm) : null,
          weight_kg: trim.model_weight_kg ? parseInt(trim.model_weight_kg) : null,
          engine_type: trim.model_engine_type || null,
          fuel_type: trim.model_engine_fuel || null
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching vehicle specs:', error);
      return null;
    }
  },

  // Convert mm to cm for our database
  convertSpecsForDatabase(specs) {
    if (!specs) return null;
    
    return {
      length_cm: specs.length_mm ? Math.round(specs.length_mm / 10) : null,
      width_cm: specs.width_mm ? Math.round(specs.width_mm / 10) : null,
      height_cm: specs.height_mm ? Math.round(specs.height_mm / 10) : null,
      weight_kg: specs.weight_kg || null,
      is_electric: specs.fuel_type?.toLowerCase().includes('electric') || false
    };
  },

  // Generate years array (current year back to 1990)
  getAvailableYears() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1990; year--) {
      years.push(year);
    }
    return years;
  }
};
