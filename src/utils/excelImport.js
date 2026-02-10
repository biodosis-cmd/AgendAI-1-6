
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
