// Hook para obtener y filtrar el catálogo de celulares desde el backend
import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from './useCustomData';
import { REQUEST_TIMEOUT } from '../config/api';

// ─── Helper para extraer la marca del celular de cualquier formato del backend ───
export const getPhoneBrand = (phone) => {
  if (!phone) return '';
  if (typeof phone.idMarca === 'object' && phone.idMarca?.name) return phone.idMarca.name;
  if (typeof phone.idMarca === 'object' && phone.idMarca?.nombre) return phone.idMarca.nombre;
  if (phone.marca) return phone.marca;
  if (phone.brand) return phone.brand;

  const text = `${phone.nombre || ''} ${phone.modelo || ''}`.toLowerCase();
  if (text.includes('iphone') || text.includes('apple')) return 'iPhone';
  if (text.includes('samsung') || text.includes('galaxy')) return 'Samsung';
  if (text.includes('xiaomi') || text.includes('redmi') || text.includes('poco')) return 'Xiaomi';
  if (text.includes('motorola') || text.includes('moto')) return 'Motorola';
  if (text.includes('oppo')) return 'Oppo';
  if (text.includes('huawei')) return 'Huawei';
  if (text.includes('google') || text.includes('pixel')) return 'Google';
  if (text.includes('honor')) return 'Honor';
  return '';
};

// ─── Helper para normalizar nombres de marcas ────────────────────────────────
export const normalizeBrand = (b) => {
  if (!b) return '';
  const lower = b.trim().toLowerCase();
  if (lower === 'iphone' || lower === 'apple') return 'iPhone';
  if (lower === 'samsung') return 'Samsung';
  if (lower === 'xiaomi') return 'Xiaomi';
  if (lower === 'motorola' || lower === 'moto') return 'Motorola';
  if (lower === 'oppo') return 'Oppo';
  if (lower === 'huawei') return 'Huawei';
  if (lower === 'google') return 'Google';
  return b.charAt(0).toUpperCase() + b.slice(1);
};

const usePhones = () => {
  const [phones, setPhones] = useState([]);
  const [dbBrands, setDbBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de filtrado
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos'); // Marca activa
  const [selectedCondition, setSelectedCondition] = useState('Todas'); // 'Todas' | 'Excelente' | 'Bueno'
  const [selectedStorage, setSelectedStorage] = useState('Todos'); // 'Todos' | '64GB' | '128GB' | '256GB' | '512GB' | '1TB'
  const [priceRange, setPriceRange] = useState('all'); // 'all' | 'under300' | '300to800' | 'over800'
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'priceAsc' | 'priceDesc' | 'nameAsc'

  // Carga de celulares y marcas desde el backend
  const fetchPhones = useCallback(async () => {
    const phonesUrl = API_ENDPOINTS.CELULARES();
    const marcasUrl = API_ENDPOINTS.MARCAS ? API_ENDPOINTS.MARCAS() : null;

    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      // Cargar celulares
      const response = await fetch(phonesUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      // Opcional: cargar marcas de la BD
      let marcasList = [];
      if (marcasUrl) {
        try {
          const marcasRes = await fetch(marcasUrl, { signal: controller.signal });
          if (marcasRes.ok) {
            const data = await marcasRes.json();
            marcasList = Array.isArray(data) ? data : data.marcas || [];
          }
        } catch {
          // Ignorar error de marcas secundario
        }
      }

      clearTimeout(timeoutId);

      if (response.ok) {
        const jsonData = await response.json();
        const phoneList = Array.isArray(jsonData)
          ? jsonData
          : jsonData.value || jsonData.celulares || jsonData.data || jsonData.phones || [];
        setPhones(phoneList);

        const extractedDbBrands = marcasList
          .map((m) => m.name || m.nombre || '')
          .filter(Boolean)
          .map(normalizeBrand);
        setDbBrands([...new Set(extractedDbBrands)]);
      } else {
        setError(`Error del servidor: ${response.status}`);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Tiempo de espera agotado al consultar el catálogo.');
      } else {
        setError('No se pudo conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhones();
  }, [fetchPhones]);

  // Lista consolidada de marcas para los chips del Header
  const getFilters = () => {
    // 1. Marcas extraídas directamente de los celulares en la BD
    const phoneBrands = phones.map((p) => normalizeBrand(getPhoneBrand(p))).filter(Boolean);
    // 2. Marcas registradas en la colección de marcas
    const combined = [...new Set([...phoneBrands, ...dbBrands])];

    // 3. Marcas populares recomendadas
    const popularBrands = ['iPhone', 'Samsung', 'Xiaomi', 'Oppo', 'Motorola'];
    popularBrands.forEach((b) => {
      if (!combined.some((c) => c.toLowerCase() === b.toLowerCase())) {
        combined.push(b);
      }
    });

    return ['Todos', ...combined];
  };

  // Restablecer todos los filtros
  const resetFilters = () => {
    setActiveFilter('Todos');
    setSelectedCondition('Todas');
    setSelectedStorage('Todos');
    setPriceRange('all');
    setSortBy('featured');
    setSearchQuery('');
  };

  // Cantidad de filtros avanzados activos (excluyendo Todos y búsqueda)
  const activeFiltersCount =
    (selectedCondition !== 'Todas' ? 1 : 0) +
    (selectedStorage !== 'Todos' ? 1 : 0) +
    (priceRange !== 'all' ? 1 : 0) +
    (sortBy !== 'featured' ? 1 : 0);

  // Catálogo filtrado según búsqueda, marca, condición, almacenamiento y precio
  const filteredPhones = phones
    .filter((phone) => {
      // 1. Filtro por Búsqueda
      const query = searchQuery.trim().toLowerCase();
      const phoneBrand = getPhoneBrand(phone);
      const name = (phone.nombre || phone.name || phone.modelo || '').toLowerCase();
      const brandStr = phoneBrand.toLowerCase();
      const storageStr = (phone.almacenamiento || '').toLowerCase();

      if (query) {
        const matchesSearch =
          name.includes(query) ||
          brandStr.includes(query) ||
          storageStr.includes(query) ||
          (phone.descripcion || '').toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // 2. Filtro por Marca activa (Chip)
      if (activeFilter !== 'Todos') {
        const normalizedPhoneBrand = normalizeBrand(phoneBrand);
        const normalizedActiveFilter = normalizeBrand(activeFilter);

        const brandMatch =
          normalizedPhoneBrand.toLowerCase() === normalizedActiveFilter.toLowerCase() ||
          name.includes(normalizedActiveFilter.toLowerCase()) ||
          (normalizedActiveFilter.toLowerCase() === 'iphone' && name.includes('apple'));

        if (!brandMatch) return false;
      }

      // 3. Filtro por Condición
      if (selectedCondition !== 'Todas') {
        const cond = (phone.condicion || phone.condition || phone.estado || '').toLowerCase();
        if (selectedCondition === 'Excelente' && !cond.includes('excel') && !cond.includes('nuevo')) {
          return false;
        }
        if (selectedCondition === 'Bueno' && !cond.includes('buen') && !cond.includes('usado')) {
          return false;
        }
      }

      // 4. Filtro por Almacenamiento
      if (selectedStorage !== 'Todos') {
        const stor = (phone.almacenamiento || phone.storage || '').toUpperCase().replace(/\s+/g, '');
        const target = selectedStorage.toUpperCase().replace(/\s+/g, '');
        if (!stor.includes(target) && !target.includes(stor)) {
          return false;
        }
      }

      // 5. Filtro por Rango de Precio
      if (priceRange !== 'all') {
        const price = Number(phone.precio || phone.price || 0);
        if (priceRange === 'under300' && price > 300) return false;
        if (priceRange === '300to800' && (price < 300 || price > 800)) return false;
        if (priceRange === 'over800' && price <= 800) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // 6. Ordenamiento
      if (sortBy === 'priceAsc') {
        return Number(a.precio || a.price || 0) - Number(b.precio || b.price || 0);
      }
      if (sortBy === 'priceDesc') {
        return Number(b.precio || b.price || 0) - Number(a.precio || a.price || 0);
      }
      if (sortBy === 'nameAsc') {
        const nameA = (a.nombre || a.name || a.modelo || '').toLowerCase();
        const nameB = (b.nombre || b.name || b.modelo || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0; // 'featured' mantiene el orden por defecto
    });

  return {
    phones,
    filteredPhones,
    loading,
    error,
    fetchPhones,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    selectedCondition,
    setSelectedCondition,
    selectedStorage,
    setSelectedStorage,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    resetFilters,
    activeFiltersCount,
    filters: getFilters(),
  };
};

export default usePhones;
