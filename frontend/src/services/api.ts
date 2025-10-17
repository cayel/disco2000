import axios from 'axios';

// Base URL dynamique: priorités -> env Vite -> window.location.origin + '/api'
const baseURL = import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export interface Record {
  id: number;
  discogs_id: string;
  titre: string;
  artistes: string[];
  annee: number;
  genres: string[];
  cover_url: string | null;
  ajout_par: string | null;
  date_ajout: string;
}

export async function fetchRecords(): Promise<Record[]> {
  const { data } = await api.get<Record[]>('/records/');
  return data;
}

export async function createRecord(payload: Omit<Record, 'id' | 'ajout_par' | 'date_ajout'>): Promise<Record> {
  const { data } = await api.post<Record>('/records/', payload);
  return data;
}

export default api;
