# Especificación de Diseño: Tarjetas de Clase (ClaseCard)

Esta guía describe cómo debe renderizarse una tarjeta de clase, replicando el diseño de **Horarios Gen**. Hay dos tipos: **Individual** y **Multi-Curso (MLT Taller)**.

---

## Estructura Visual

Cada bloque de clase es un contenedor horizontal dividido en dos zonas:

```
┌──────────────────────────────────────────────────┐
│  SIDEBAR   │  CONTENIDO                          │
│  (w-14)    │                                     │
│            │  08:00 / 90m              [x]       │
│  MLT       │  Tecnología                         │
│  TALLER    │  5to, 6to, 7mo, 8vo                │
└──────────────────────────────────────────────────┘
```

---

## JSX — Tarjeta Individual

```jsx
<div className="absolute inset-x-[1px] rounded-lg shadow-sm overflow-hidden bg-slate-800/90 hover:bg-slate-700/90 transition-colors group z-20"
     style={{ top: block.top, height: block.height }}>
  <div className="flex h-full w-full">

    {/* Sidebar de curso */}
    <div className={`h-full w-14 min-w-[3.5rem] flex flex-col items-center justify-center ${cursoColor} text-white`}>
      <span className="text-xl font-bold leading-none text-center px-0.5">
        {mainText}  {/* ej: "5B", "NT1", "K" */}
      </span>
      <span className="text-[9px] uppercase font-medium mt-0.5 opacity-90">
        {subText}   {/* ej: "Básico", "Medio", "Pre-K" */}
      </span>
    </div>

    {/* Contenido */}
    <div className="flex-grow relative flex flex-col justify-center min-w-0 overflow-hidden p-2">
      <span className="text-[10px] font-mono text-slate-400 mb-0.5">
        {block.hora} / {block.duration}m
      </span>
      <h3 className="font-bold text-slate-200 leading-none text-xs line-clamp-2 break-words whitespace-normal w-full overflow-hidden">
        {block.asignatura}
      </h3>
    </div>

  </div>
</div>
```

---

## JSX — Tarjeta Multi-Curso (MLT Taller)

Se activa cuando `block.isMultiCourse === true`. El sidebar usa `bg-indigo-600` fijo y muestra "MLT / TALLER". El contenido agrega una línea con los cursos involucrados.

```jsx
<div className="absolute inset-x-[1px] rounded-lg shadow-sm overflow-hidden bg-slate-800/90 hover:bg-slate-700/90 transition-colors group z-20"
     style={{ top: block.top, height: block.height }}>
  <div className="flex h-full w-full">

    {/* Sidebar siempre indigo para multi-curso */}
    <div className="h-full w-14 min-w-[3.5rem] flex flex-col items-center justify-center bg-indigo-600 text-white">
      <span className="text-sm font-bold leading-none text-center px-0.5">MLT</span>
      <span className="text-[8px] uppercase font-bold mt-0.5 opacity-90 leading-none">Taller</span>
    </div>

    {/* Contenido */}
    <div className="flex-grow relative flex flex-col justify-center min-w-0 overflow-hidden p-2">
      <span className="text-[10px] font-mono text-slate-400 mb-0.5">
        {block.hora} / {block.duration}m
      </span>
      <h3 className="font-bold text-slate-200 leading-none text-xs line-clamp-2 break-words whitespace-normal w-full overflow-hidden">
        {block.asignatura}
      </h3>
      {/* Solo el primer token de cada curso, ej: "5to, 6to, 7mo, 8vo" */}
      <p className="text-[8px] text-indigo-300 font-medium mt-1 truncate">
        {block.cursos.map(c => c.split(' ')[0]).join(', ')}
      </p>
    </div>

  </div>
</div>
```

---

## Esquema de Datos del Bloque

```ts
interface ClaseBlock {
  dia: number;          // 1=Lunes … 5=Viernes
  hora: string;         // "08:00"
  duration: number;     // minutos: 45 | 90
  asignatura: string;   // "Tecnología"
  curso: string;        // "5to Básico" | "Taller" (si isMultiCourse)
  isMultiCourse: boolean;
  cursos: string[];     // [] para individual | ["5to Básico", "6to Básico", …] para MLT
  // calculados:
  top: number;          // px desde el inicio de columna = minutosDesdeInicio * pixelsPerMinute
  height: number;       // px = duration * pixelsPerMinute
}
```

---

## Paleta de Colores por Curso (sidebar individual, Tailwind)

| Curso           | Clase Tailwind     |
|-----------------|--------------------|
| NT1             | `bg-rose-500`      |
| NT2             | `bg-fuchsia-500`   |
| 1ro Básico      | `bg-violet-600`    |
| 2do Básico      | `bg-blue-600`      |
| 3ro Básico      | `bg-cyan-500`      |
| 4to Básico      | `bg-teal-500`      |
| 5to Básico      | `bg-emerald-500`   |
| 6to Básico      | `bg-lime-500`      |
| 7mo Básico      | `bg-amber-500`     |
| 8vo Básico      | `bg-orange-500`    |
| 1ro Medio       | `bg-amber-500`     |
| 2do Medio       | `bg-orange-600`    |
| 3ro Medio       | `bg-rose-600`      |
| 4to Medio       | `bg-violet-700`    |
| 1er/2do Ciclo   | `bg-slate-500`     |
| Desconocido     | `bg-slate-600`     |
| **Multi-curso** | **`bg-indigo-600`**|

---

## Lógica de Formato del Sidebar (función JS)

```js
function formatCourseForCard(courseName) {
  if (!courseName) return { main: '?', sub: '' };
  const parts = courseName.split(' ');

  // Buscar letra final (ej: "A", "B")
  let letter = '';
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].length === 1 && /^[A-Z]$/i.test(parts[i])) {
      letter = parts[i]; break;
    }
  }

  if (courseName.startsWith('NT1')) return { main: letter ? `NT1 ${letter}` : 'NT1', sub: 'Pre-K' };
  if (courseName.startsWith('NT2')) return { main: letter ? `NT2 ${letter}` : 'NT2', sub: 'Kinder' };
  if (courseName.toLowerCase().includes('ciclo')) return { main: parts[0] + letter, sub: 'Ciclo' };

  // Estándar: "1ro Básico A" → main="1A", sub="Básico"
  let number = parts[0].replace(/(ro|do|to|mo|vo|er|da|ta|ma|va)/g, '');
  let level = '';
  for (let i = 1; i < parts.length; i++) {
    if (parts[i] === 'Básico' || parts[i] === 'Básica') level = 'Básico';
    else if (parts[i] === 'Medio' || parts[i] === 'Media') level = 'Medio';
  }
  return { main: `${number}${letter}`, sub: level };
}
```

**Tamaño del `main`:** `text-xl` si `main.length <= 3` y no es multi-curso; sino `text-sm`.

---

## Adaptación para bloques cortos (≤ 45 min)

| Elemento          | Normal (`> 45m`)            | Corto (`≤ 45m`)              |
|-------------------|-----------------------------|------------------------------|
| Padding contenido | `p-2`                       | `p-1`                        |
| Tamaño hora       | `text-[10px]`               | `text-[9px]`                 |
| Tamaño asignatura | `text-xs line-clamp-2`      | `text-[10px] max-h-[2.4em]`  |
| Margen bajo hora  | `mb-0.5`                    | `mb-0`                       |
