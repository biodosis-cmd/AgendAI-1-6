
import * as XLSX from 'xlsx';

/**
 * Maps Spanish day names to integer (1=Monday ... 5=Friday)
 */
const DAY_MAP = {
    'lunes': 1,
    'martes': 2,
    'miércoles': 3,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sábado': 6,
    'sabado': 6,
    'domingo': 0
};

/**
 * Parses the Schedule Excel file.
 * Expected Structure based on User Template:
 * A2: Año Licencia (e.g., 2026)
 * Row 1: Headers
 * Row 2+: Data
 * 
 * Columns (0-based index mapped from A, B, C...):
 * B (1): Dia
 * C (2): Hora Inicio
 * D (3): Duracion
 * E (4): Curso
 * F (5): Letra
 * G (6): Asignatura
 * H (7): Detalle/Otro
 * 
 * @param {ArrayBuffer} fileBuffer 
 * @returns {Promise<{success: boolean, data?: Object, validYear?: number, error?: string}>}
 */
export const parseScheduleExcel = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // 1. Get Licencia Year from Cell A2
            const cellA2 = sheet['A2'];
            let validYear = new Date().getFullYear(); // Default
            if (cellA2 && cellA2.v) {
                validYear = parseInt(cellA2.v);
            }

            // 2. Convert to JSON (Array of Arrays for strict position control)
            // header: 1 means we get array of arrays. range: 1 means skip row 1 (headers)
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 1 });

            const scheduleData = {};
            let count = 0;

            jsonData.forEach((row, rowIndex) => {
                // Row Structure:
                // [0]=A(Year-Empty), [1]=B(Dia), [2]=C(Hora), [3]=D(Duracion), 
                // [4]=E(Curso), [5]=F(Letra), [6]=G(Asignatura), [7]=H(Detalle)

                // Skip if essential data is missing (Dia or Curso or Asignatura/Detalle)
                if (!row[1] || !row[4]) return;

                // --- PARSE FIELDS ---
                const rawDia = String(row[1]).toLowerCase().trim();
                const diaInt = DAY_MAP[rawDia];

                // Time Parsing: Excel sometimes returns 0.354166 for 8:30. 
                // Or string "08:30". We need to handle both.
                let rawHora = row[2];
                let finalHora = "08:00"; // Fallback

                if (typeof rawHora === 'number') {
                    // Convert JS Date fraction to HH:MM
                    const totalSeconds = Math.round(86400 * rawHora);
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    finalHora = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                } else if (typeof rawHora === 'string') {
                    finalHora = rawHora.trim();
                }

                const duracion = parseInt(row[3]) || 90;

                // Curso + Letra
                let curso = String(row[4]).trim();
                const letra = row[5] ? String(row[5]).trim() : '';
                if (letra && letra !== '-' && letra.toLowerCase() !== 'n/a') {
                    curso = `${curso} ${letra}`;
                }

                // Asignatura logic
                let asignatura = row[6] ? String(row[6]).trim() : '';
                const detalle = row[7] ? String(row[7]).trim() : '';

                // If Asignatura is generic or empty, and Detalle exists, use Detalle
                const lowerAsig = asignatura.toLowerCase();
                if ((lowerAsig === 'personalizada' || lowerAsig === 'personalizado' || lowerAsig === 'otro' || lowerAsig === 'talleres' || !asignatura) && detalle) {
                    asignatura = detalle;
                }

                if (!diaInt || !asignatura) return; // Invalid row

                // --- BUILD STRUCTURE ---
                if (!scheduleData[curso]) scheduleData[curso] = {};
                if (!scheduleData[curso][asignatura]) scheduleData[curso][asignatura] = [];

                // 3. STRICT DEDUPLICATION (Fix for Phantom Blocks)
                // Check if a block with EXACTLY the same Day and Time already exists for this Subject/Course
                const existingBlockIndex = scheduleData[curso][asignatura].findIndex(
                    b => b.dia === diaInt && b.hora === finalHora
                );

                if (existingBlockIndex !== -1) {
                    // Duplicate found! We act conservatively and DO NOT add it.
                    // This handles cases where Excel contains repeated rows.
                    // console.warn(`Duplicate block ignored: ${curso} ${asignatura} ${finalHora}`);
                    return;
                }

                // Add block
                scheduleData[curso][asignatura].push({
                    dia: diaInt,
                    hora: finalHora,
                    duration: duracion
                });
                count++;
            });

            resolve({
                success: true,
                validYear,
                scheduleData,
                count
            });

        } catch (error) {
            console.error("Error parsing Excel:", error);
            resolve({ success: false, error: error.message });
        }
    });
};

/**
 * Parses Dates from Excel properly (handles serial numbers, standard strings, and native JS Dates).
 * Excel serial dates are days since 1899-12-30.
 */
const parseExcelDate = (value) => {
    if (!value) return null;

    // If XLSX parsed it as a native JS Date
    if (value instanceof Date) {
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, '0');
        const d = String(value.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // If it's an Excel serial date number
    if (typeof value === 'number') {
        const date = new Date((value - 25569) * 86400 * 1000);
        // Fix timezone offset issues so we get the exact date
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

        return adjustedDate.toISOString().split('T')[0]; // Return YYYY-MM-DD
    }

    // If it's a string like "05-03-2026" or "05/03/2026"
    if (typeof value === 'string') {
        // If it comes already as YYYY-MM-DD
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return value;
        }

        const parts = value.split(/[-/]/);
        if (parts.length === 3) {
            // Assume DD-MM-YYYY
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            return `${year}-${month}-${day}`;
        }
    }
    return null;
};

/**
 * Parses the School Calendar Excel file.
 * Expected Structure:
 * B1: Inicio Año Escolar (Fecha)
 * B2: Termino Año Escolar (Fecha)
 * Row 4: Headers for Holidays (A: Descripcion, B: Desde, C: Hasta)
 * Row 5+: Holidays Data
 * 
 * @param {ArrayBuffer} fileBuffer 
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const parseCalendarExcel = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // 1. Get School Year Limits from B1 and B2
            const cellB1 = sheet['B1']; // Start date
            const cellB2 = sheet['B2']; // End date

            let schoolYearStart = null;
            let schoolYearEnd = null;

            if (cellB1 && cellB1.v) schoolYearStart = parseExcelDate(cellB1.v);
            if (cellB2 && cellB2.v) schoolYearEnd = parseExcelDate(cellB2.v);

            // 2. Get Holidays Data
            // We read the entire sheet as array of arrays without skipping ranges,
            // to be extremely bulletproof regarding empty rows.
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const excludedDates = [];

            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];

                // If row doesn't have at least two fields, or if we are at the top metadata rows, skip.
                // We identify the 'Inicio Año Escolar' and 'Termino Año Escolar' strings to skip them explicitly,
                // and also skip empty rows.
                if (!row || row.length < 2 || !row[0] || !row[1]) continue;

                const title = String(row[0]).trim();
                const lowerTitle = title.toLowerCase();

                // Skip header or metadata rows that might exist in column A
                if (
                    lowerTitle === 'descripción' ||
                    lowerTitle === 'descripcion' ||
                    lowerTitle.includes('año escolar') ||
                    lowerTitle === ''
                ) {
                    continue;
                }

                const startRaw = row[1];
                const endRaw = row[2] || startRaw; // If no end date, use start date again

                const start = parseExcelDate(startRaw);
                const end = parseExcelDate(endRaw);

                // Only add if we got a valid parsed date
                if (start && end) {
                    excludedDates.push({
                        id: Date.now() + i, // Unique ID
                        title,
                        start,
                        end
                    });
                }
            }

            resolve({
                success: true,
                data: {
                    schoolYearStart,
                    schoolYearEnd,
                    excludedDates
                }
            });

        } catch (error) {
            console.error("Error parsing Calendar Excel:", error);
            resolve({ success: false, error: error.message });
        }
    });
};
