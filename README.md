# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Live reload and build watcher

This project includes helper scripts to rebuild on file changes and serve the `dist` folder with live reload:

- `npm run dev` — start Vite dev server with HMR (preferred for development).
- `npm run build:watch` — run a watcher that rebuilds the `dist` output when files in `src/` change.
- `npm run livereload` — run the build watcher and a static server with live reload for `dist` concurrently (useful to preview production build with automatic rebuilds).

Example: run `npm run livereload`, edit `src/` files, and the project will rebuild and the static server will trigger a reload.
