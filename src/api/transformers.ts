import type { ProfessorData } from '../types/lezione';

export const parseDocenteEmail = (rawName: string): string => {
  if (!rawName) return '';
  
  const cleanName = rawName
    .replace(/<[^>]+>/g, '')
    .replace(/Prof\.ssa|Prof\.|Dott\.ssa|Dott\./gi, '')
    .trim()
    .toLowerCase()
    .replace(/[']/g, '')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
                 
  const parts = cleanName.split(/\s+/).filter(Boolean);
  
  // UniSalento emails are usually name.surname@unisalento.it
  // For "Mario Rossi" -> mario.rossi
  // For "Anna Maria Esposito" -> annamaria.esposito
  if (parts.length >= 2) {
    const surname = parts.pop();
    const name = parts.join('');
    return `${name}.${surname}@unisalento.it`;
  }
  
  return parts.length === 1 ? `${parts[0]}@unisalento.it` : '';
};

export const getProfessorsData = (rawDocente: string, rawMail: string): ProfessorData[] => {
  if (!rawDocente) return [];
  
  const names = rawDocente.split(',').map(n => n.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  const emails = rawMail ? rawMail.split(',').map(m => m.trim()).filter(Boolean) : [];

  return names.map((nome, index) => ({
    nome,
    email: emails[index] || parseDocenteEmail(nome)
  }));
};

export const cleanHtmlTags = (text: string): string => {
  if (!text) return '';
  return text.replace(/<[^>]+>/g, '').trim();
};
