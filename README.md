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

## Stack

- **Backend:** Node.js + Express (ESM)
- **Frontend:** Vue 3 + Vite + Tailwind CSS + daisyUI
