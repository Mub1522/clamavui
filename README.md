# clamav-ui

Interfaz web local para ClamAV. Permite escanear archivos y carpetas, actualizar la base de datos de virus y consultar el historial de escaneos.

## Requisitos

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/)
- [ClamAV](https://www.clamav.net/) instalado y `clamscan` / `freshclam` disponibles en el PATH del sistema

## Instalación

```bash
git clone https://github.com/tu-usuario/clamav-ui.git
cd clamav-ui
pnpm install
```

## Uso

```bash
# Desarrollo (backend :3000 + frontend :5173)
pnpm dev

# Producción
pnpm build
pnpm start
```

Con PM2:

```bash
pm2 start ecosystem.config.cjs
```

> **Nota:** `ecosystem.config.cjs` tiene hardcodeado `cwd: 'C:/Users/USUARIO/Desktop/clamav-ui'`. Actualiza esa ruta a donde hayas clonado el repositorio antes de usar PM2.

### Arranque automático con el Programador de tareas de Windows

`start-pm2.bat` ejecuta `pm2 resurrect`, que restaura los procesos guardados por PM2. Para que la app vuelva a levantarse sola después de un reinicio de la PC:

1. Arranca la app y guarda el estado de PM2 (solo una vez):
   ```powershell
   pm2 start ecosystem.config.cjs
   pm2 save
   ```
2. Abre el **Programador de tareas** de Windows (`taskschd.msc`) → **Crear tarea básica**.
3. Desencadenador: **Al iniciar sesión** (o "Al iniciar el equipo" si quieres que arranque sin necesidad de loguearte).
4. Acción: **Iniciar un programa** → selecciona `start-pm2.bat` (ruta completa, ej. `C:\Users\USUARIO\Desktop\clamav-ui\start-pm2.bat`).
5. En las opciones de la tarea, marca **"Ejecutar tanto si el usuario inició sesión como si no"** y **"Ejecutar con los privilegios más altos"** si PM2 lo requiere.
6. Guarda y reinicia la PC para probar que el servicio levanta solo.

## Stack

- **Backend:** Node.js + Express (ESM)
- **Frontend:** Vue 3 + Vite + Tailwind CSS + daisyUI
