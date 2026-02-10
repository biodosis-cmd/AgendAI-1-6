export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
export const DIAS_SEMANA_COMPLETA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const MESES_ANIO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const LISTA_CURSOS = [
    'NT1',
    'NT2',
    '1ro Básico',
    '2do Básico',
    '3ro Básico',
    '4to Básico',
    '5to Básico',
    '6to Básico',
    '7mo Básico',
    '8vo Básico',
    '1ro Medio',
    '2do Medio',
    '3ro Medio',
    '4to Medio'
];

export const LISTA_ASIGNATURAS = [
    'Lenguaje y Comunicación',
    'Matemáticas',
    'Ciencias Naturales',
    'Historia, Geografía y Ciencias Sociales',
    'Inglés',
    'Artes Visuales',
    'Música',
    'Educación Física y Salud',
    'Tecnología',
    'Orientación',
    'Religión',
    'Física',
    'Química',
    'Biología',
    'Filosofía',
    'Educación Ciudadana'
];

export const START_HOUR = 8;
export const END_HOUR = 18;
export const PIXELS_PER_MINUTE = 0.9;

// Mapeo de temas modernos por curso (Diseño Soft UI)
export const CURSO_THEME = {
    'NT1': { base: 'red', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', accent: 'bg-red-500', hover: 'hover:border-red-400', shadow: 'shadow-red-500/10' },
    'Prekinder': { base: 'red', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', accent: 'bg-red-500', hover: 'hover:border-red-400', shadow: 'shadow-red-500/10' },

    'NT2': { base: 'pink', bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200', accent: 'bg-pink-500', hover: 'hover:border-pink-400', shadow: 'shadow-pink-500/10' },
    'kinder': { base: 'pink', bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200', accent: 'bg-pink-500', hover: 'hover:border-pink-400', shadow: 'shadow-pink-500/10' },

    '1ro Básico': { base: 'violet', bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200', accent: 'bg-violet-500', hover: 'hover:border-violet-400', shadow: 'shadow-violet-500/10' },

    '2do Básico': { base: 'indigo', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', accent: 'bg-indigo-500', hover: 'hover:border-indigo-400', shadow: 'shadow-indigo-500/10' },

    '3ro Básico': { base: 'blue', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', accent: 'bg-blue-500', hover: 'hover:border-blue-400', shadow: 'shadow-blue-500/10' },

    '4to Básico': { base: 'sky', bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', accent: 'bg-sky-500', hover: 'hover:border-sky-400', shadow: 'shadow-sky-500/10' },

    '5to Básico': { base: 'teal', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200', accent: 'bg-teal-500', hover: 'hover:border-teal-400', shadow: 'shadow-teal-500/10' },

    '6to Básico': { base: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', accent: 'bg-emerald-500', hover: 'hover:border-emerald-400', shadow: 'shadow-emerald-500/10' },

    '7mo Básico': { base: 'green', bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', accent: 'bg-green-500', hover: 'hover:border-green-400', shadow: 'shadow-green-500/10' },

    '8vo Básico': { base: 'lime', bg: 'bg-lime-50', text: 'text-lime-800', border: 'border-lime-200', accent: 'bg-lime-500', hover: 'hover:border-lime-400', shadow: 'shadow-lime-500/10' },

    '1ro Medio': { base: 'amber', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', accent: 'bg-amber-500', hover: 'hover:border-amber-400', shadow: 'shadow-amber-500/10' },
    '2do Medio': { base: 'orange', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', accent: 'bg-orange-500', hover: 'hover:border-orange-400', shadow: 'shadow-orange-500/10' },
    '3ro Medio': { base: 'rose', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', accent: 'bg-rose-500', hover: 'hover:border-rose-400', shadow: 'shadow-rose-500/10' },
    '4to Medio': { base: 'violet', bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200', accent: 'bg-violet-600', hover: 'hover:border-violet-500', shadow: 'shadow-violet-500/10' },
};

// Compatibilidad con versiones anteriores si es necesario, pero preferir usar CURSO_THEME
export const CURSO_COLORES = {
    'Prekinder': 'bg-red-500',
    'NT1': 'bg-rose-500',
    'kinder': 'bg-pink-500',
    'NT2': 'bg-fuchsia-500',
    '1ro Básico': 'bg-violet-600',
    '2do Básico': 'bg-blue-600',
    '3ro Básico': 'bg-cyan-500',
    '4to Básico': 'bg-teal-500',
    '5to Básico': 'bg-emerald-500',
    '6to Básico': 'bg-lime-500',
    '7mo Básico': 'bg-amber-500',
    '8vo Básico': 'bg-orange-500',
    '1ro Medio': 'bg-amber-500',
    '2do Medio': 'bg-orange-600',
    '3ro Medio': 'bg-rose-600',
    '4to Medio': 'bg-violet-700',
};

export const CURSO_HEX_COLORES = {
    'Prekinder': '#EF4444',
    'NT1': '#EF4444',
    'kinder': '#EC4899',
    'NT2': '#EC4899',
    '1ro Básico': '#8B5CF6',
    '2do Básico': '#6366F1',
    '3ro Básico': '#3B82F6',
    '4to Básico': '#06B6D4',
    '5to Básico': '#14B8A6',
    '6to Básico': '#10B981',
    '7mo Básico': '#22C55E',
    '8vo Básico': '#84CC16',
    '1ro Medio': '#F59E0B',
    '2do Medio': '#EA580C',
    '3ro Medio': '#E11D48',
    '4to Medio': '#7C3AED', // Violet/Purple (Distinct from Slate)
    'default': '#6B7280'
};

export const COLLECTIONS = {
    CLASSES: 'classes',
    UNITS: 'units',
    SCHEDULES: 'schedules'
};

export const STATUS = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    ARCHIVED: 'archived'
};
