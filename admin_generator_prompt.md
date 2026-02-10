
# Proyecto: Generador de Horarios AgendAI (Modo Admin)

**Objetivo:** Crear una aplicación web sencilla y segura para **generar, editar y exportar horarios escolares** en formato JSON codificado (Licencias), que serán consumidos por la aplicación principal "AgendAI" (versión usuario).

**Tecnologías:** React + Vite + Tailwind CSS + Lucide React.
**Persistencia:** LocalStorage (para guardar borradores) o descarga directa de archivos JSON. No se requiere backend complejo.

## Funcionalidades Clave

1.  **Editor de Horarios (Drag & Drop o Click):**
    *   **Interfaz:** Una grilla semanal (Lunes a Viernes) con bloques horarios (ej. 08:00 a 16:00).
    *   **Acciones:**
        *   **Agregar Bloque:** Seleccionar un curso (ej. "1° Básico"), una asignatura (ej. "Matemáticas"), un día, hora de inicio y duración (minutos).
        *   **Eliminar Bloque:** Click en un bloque existente para borrarlo.
        *   **Validación:** Evitar superposición de horarios para el mismo curso (mismo día y hora).
    *   **Visualización:** Los bloques deben mostrar Curso, Asignatura y Duración. Usar colores distintos por curso o asignatura.

2.  **Gestión de Datos (Estructura Interna):**
    *   La estructura de datos del horario **debe ser exactamente esta** para compatibilidad:
        ```javascript
        // scheduleData
        {
          "1° Básico": {
            "Matemáticas": [
              { "dia": 1, "hora": "08:00", "duration": 90 }, // dia 1 = Lunes
              { "dia": 3, "hora": "10:00", "duration": 45 }
            ],
            "Lenguaje": [ ... ]
          },
          "2° Básico": { ... }
        }
        ```

3.  **Generador de Licencias (Exportar):**
    *   **Botón "Generar Licencia":** Debe tomar el `scheduleData` actual y empaquetarlo en un objeto JSON.
    *   **Formato de Salida:**
        ```javascript
        {
          "name": "Nombre del Horario (ej. Colegio X 2024)",
          "activeFrom": "ALWAYS",
          "validYear": 2024, // Input numérico editable
          "scheduleData": { ... } // La estructura de arriba
        }
        ```
    *   **Codificación:** El resultado final debe ser un **String Base64** para que el usuario final solo vea un "código largo" y no pueda editarlo fácilmente.
        *   *Algoritmo:* `btoa(unescape(encodeURIComponent(JSON.stringify(objeto))))`

4.  **Importar Borrador:**
    *   Capacidad de pegar un código de licencia previo para "editar" un horario existente (Decodificar Base64 -> JSON -> Cargar en Editor).

## Componentes Sugeridos

*   `ScheduleGrid`: Componente visual que renderiza los bloques.
*   `EditorControls`: Formulario para seleccionar Curso, Asignatura, Día, Hora y Duración.
*   `LicenseGenerator`: Panel con el botón de exportar y el área de texto con el código Base64 generado.

## Estilo Visual
*   Tema Oscuro (Dark Mode) por defecto, estilo "Cyberpunk/Futurista" o limpio profesional (Slate/Indigo).
*   Uso de `lucide-react` para iconos (Save, Trash, Download, Copy).

## Constantes Necesarias
*   **Cursos:** PK, K, 1° a 8° Básico, I a IV Medio.
*   **Asignaturas:** Lenguaje, Matemáticas, Ciencias, Historia, Inglés, Ed. Física, Artes, Música, Tecnología, Religión, Orientación.
*   **Bloques Horarios:** Módulos de 45 o 90 minutos típicamente.

## Instrucción para la IA Generadora
"Por favor, inicializa este proyecto usando Vite y crea los componentes necesarios para cumplir con el flujo de edición y generación de licencias descrito. La prioridad es la **integridad de la estructura de datos** para asegurar compatibilidad con la app de usuario."
