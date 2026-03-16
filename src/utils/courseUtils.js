import { CURSO_COLORES } from '@/constants';

/**
 * Formats a course name into main and sub text for the card sidebar.
 * Spec:
 * - "NT1 B" -> main="NT1 B", sub="Pre-K"
 * - "NT2" -> main="NT2", sub="Kinder"
 * - "1ro Básico A" -> main="1A", sub="Básico"
 * - "1er Ciclo" -> main="1er", sub="Ciclo"
 */
export function formatCourseForCard(courseName) {
    if (!courseName) return { main: '?', sub: '' };
    
    // Handle Multi-course cases if passed here (though usually handled by isMultiCourse flag)
    if (courseName === 'Taller' || courseName === 'Multi-curso') {
        return { main: 'MLT', sub: 'Taller' };
    }

    const parts = courseName.split(' ');

    // Buscar letra final (ej: "A", "B")
    let letter = '';
    for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].length === 1 && /^[A-Z]$/i.test(parts[i])) {
            letter = parts[i];
            break;
        }
    }

    if (courseName.startsWith('NT1')) return { main: letter ? `NT1 ${letter}` : 'NT1', sub: 'Pre-K' };
    if (courseName.startsWith('NT2')) return { main: letter ? `NT2 ${letter}` : 'NT2', sub: 'Kinder' };
    if (courseName.toLowerCase().includes('ciclo')) return { main: parts[0] + letter, sub: 'Ciclo' };

    // Estándar: "1ro Básico A" → main="1A", sub="Básico"
    let number = parts[0].replace(/(ro|do|to|mo|vo|er|da|ta|ma|va)/g, '');
    let level = '';
    for (let i = 1; i < parts.length; i++) {
        const p = parts[i].toLowerCase();
        if (p === 'básico' || p === 'básica') level = 'Básico';
        else if (p === 'medio' || p === 'media') level = 'Medio';
    }
    
    return { main: `${number}${letter}`, sub: level };
}

/**
 * Returns the Tailwind background class for a course.
 */
export function getColorForCourse(courseName, isMultiCourse = false) {
    if (isMultiCourse) return 'bg-[#3a3a5a]';
    if (!courseName) return 'bg-slate-600';

    // 1. Try exact match
    if (CURSO_COLORES[courseName]) return CURSO_COLORES[courseName];

    // 2. Try stripping suffix (e.g. "7mo Básico A" -> "7mo Básico")
    const parts = courseName.split(' ');
    if (parts.length >= 2 && parts[parts.length - 1].length === 1) {
        const baseName = parts.slice(0, -1).join(' ');
        if (CURSO_COLORES[baseName]) return CURSO_COLORES[baseName];
    }

    return 'bg-slate-600';
}
