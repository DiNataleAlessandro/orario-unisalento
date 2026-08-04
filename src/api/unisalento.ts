import { formatDateForAPI, getAcademicYear } from '../utils/date';

const URL_API = '/api-unisalento/PortaleStudenti/grid_call.php';

export interface FetchWeekParams {
  dataTarget: Date;
  corsoCodice: string;
  annoCodice: string;
  isForced?: boolean;
  txtcurr?: string;
}

export const fetchSingleWeek = async ({ dataTarget, corsoCodice, annoCodice, isForced = false, txtcurr }: FetchWeekParams) => {
  const dataStr = formatDateForAPI(dataTarget);
  const cacheKey = `orario_${corsoCodice}_${annoCodice}_${dataStr}`;
  const cachedData = localStorage.getItem(cacheKey); 
  
  if (cachedData && !isForced) return JSON.parse(cachedData); 

  if (!navigator.onLine) {
    return cachedData ? JSON.parse(cachedData) : { celle: [] };
  }

  let finalTxtcurr = txtcurr;
  if (!finalTxtcurr) {
    const annoNome = localStorage.getItem('annoNome');
    finalTxtcurr = annoNome ? annoNome.split(',')[0].trim() : '1 - Percorso comune';
  }

  const formData = new URLSearchParams();
  formData.append('view', 'easycourse');
  formData.append('form-type', 'corso');
  formData.append('include', 'corso');
  formData.append('txtcurr', finalTxtcurr);
  formData.append('anno', getAcademicYear(dataTarget)); 
  formData.append('corso', corsoCodice); 
  formData.append('anno2[]', annoCodice); 
  formData.append('visualizzazione_orario', 'cal');
  formData.append('date', dataStr); 
  formData.append('_lang', 'it');
  formData.append('week_grid_type', '-1');
  formData.append('col_cells', '0');
  formData.append('empty_box', '0');
  formData.append('only_grid', '0');
  formData.append('highlighted_date', '0');
  formData.append('all_events', '0');
  formData.append('faculty_group', '0');

  const response = await fetch(URL_API, {
    method: 'POST', 
    body: formData, 
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }
  });

  if (!response.ok) throw new Error(`Errore server: ${response.status}`);
  const result = await response.json();
  localStorage.setItem(cacheKey, JSON.stringify(result));
  
  return result;
};
