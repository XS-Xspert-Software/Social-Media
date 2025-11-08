# 🚀 GitHub Codespaces UI Development Guide

This guide will help you develop and iterate on the Social Media UI using GitHub Codespaces.

## Quick Start

### 1. Open in Codespaces

Click the "Code" button on GitHub and select "Create codespace on main" (or your branch).

### 2. Automatic Setup

The devcontainer will automatically:
- Install Node.js 20
- Install all dependencies
- Start Docker services (database, backend, websocket)
- Configure VS Code with helpful extensions

### 3. Start UI Development

Use the quick-start script:

```bash
./dev-ui.sh
```

Or manually:

```bash
cd frontend
npm run dev
```

### 4. Access Your Application

- **Frontend UI**: Click on the "Ports" tab in VS Code, then click the globe icon next to port 5173
- Or look for the notification that says "Your application running on port 5173 is available"

## 🔥 Hot Module Replacement (HMR)

The UI development environment is configured for **instant hot reload**:

1. Edit any file in `frontend/src/`
2. Save the file (auto-save is enabled by default)
3. See changes **instantly** in your browser - no manual refresh needed!

### HMR Tips

- ✅ **Vue components** - Instant updates preserving state
- ✅ **CSS/Styles** - Instant updates without page reload
- ✅ **JavaScript** - Fast updates with module replacement
- ⚠️ **Config files** - Require dev server restart

## 🎨 UI Development Workflow

### Iterative Development Loop

1. **Make a change** to a Vue component in `frontend/src/`
2. **Save the file** (Ctrl+S or Cmd+S)
3. **View instantly** in the browser (HMR applies the change)
4. **Repeat** - no build step, no manual refresh!

### Key Files and Directories

```
frontend/
├── src/
│   ├── App.vue           # Main app component
│   ├── Posts.vue         # Posts feed
│   ├── Chat.vue          # Chat interface
│   ├── Videos.vue        # Video feed
│   ├── components/       # Reusable components
│   ├── router/           # Vue Router configuration
│   ├── stores/           # Pinia state management
│   └── style.css         # Global styles
├── public/               # Static assets
└── vite.config.js        # Vite configuration (with HMR settings)
```

## 🛠️ Development Tools

### VS Code Extensions (Auto-installed)

- **Vue - Official (Volar)** - Vue 3 language support
- **Prettier** - Code formatting on save
- **ESLint** - Linting and code quality
- **Auto Rename Tag** - Automatically rename paired HTML/Vue tags
- **Tailwind CSS IntelliSense** - If you add Tailwind
- **GitHub Copilot** - AI pair programming

### VS Code Settings (Pre-configured)

- ✅ Auto-save after 1 second delay
- ✅ Format on save with Prettier
- ✅ ESLint auto-fix on save
- ✅ Vue-specific formatting

## 🐛 Debugging

### Browser DevTools

1. Open the forwarded port 5173 in your browser
2. Press F12 to open DevTools
3. Use Vue DevTools extension for component inspection

### VS Code Debugging

The devcontainer includes debugging support:

1. Set breakpoints in your `.vue` files
2. Use the Debug panel to start debugging
3. Attach to the Vite dev server

## 📦 Port Forwarding

Codespaces automatically forwards these ports:

| Port | Service | Access |
|------|---------|--------|
| 5173 | Frontend (Vite) | Click globe icon in Ports tab |
| 3000 | Backend API | Available at `/api` through frontend proxy |
| 4000 | WebSocket | Used for real-time features |
| 8000 | Video Backend | Video processing service |
| 5432 | PostgreSQL | Database (not exposed publicly) |

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory if needed:

```bash
# Frontend .env
VITE_API_BASE=http://localhost:3000
```

### Vite Configuration

The `vite.config.js` is optimized for Codespaces with:

- **Host**: `0.0.0.0` - Listen on all interfaces
- **HMR**: Configured for virtual machine environments
- **Watch**: Optional polling mode for compatibility
- **Proxy**: API requests forwarded to backend

### Enable Polling (if HMR doesn't work)

If hot reload isn't working, enable file polling:

```bash
export VITE_USE_POLLING=true
npm run dev
```

## 🚀 Advanced Features

### Running Tests

```bash
cd frontend
npm run test
```

### Building for Production

```bash
cd frontend
npm run build
```

### Full Stack Development

All services are available in Codespaces:

```bash
# View all running services
docker compose ps

# View logs
docker compose logs -f frontend
docker compose logs -f backend

# Restart a service
docker compose restart frontend
```

## 💡 Tips for Perfect UI

1. **Use Component Composition** - Break down complex UIs into smaller components
2. **Leverage HMR** - See changes instantly without losing state
3. **Test Responsive Design** - Use browser DevTools device toolbar
4. **Check Accessibility** - Use Lighthouse in Chrome DevTools
5. **Monitor Performance** - Use Vue DevTools performance tab
6. **Auto-format** - Let Prettier handle formatting automatically

## 🆘 Troubleshooting

### HMR Not Working

1. Check if the dev server is running: `docker compose ps`
2. Enable polling: Set `VITE_USE_POLLING=true`
3. Restart the dev server: `Ctrl+C` then `npm run dev`

### Port Not Accessible

1. Check the "Ports" tab in VS Code
2. Ensure port 5173 is listed and forwarded
3. Click the globe icon to open in browser

### Changes Not Reflecting

1. Hard reload browser: `Ctrl+Shift+R` (or `Cmd+Shift+R`)
2. Clear browser cache
3. Check browser console for errors
4. Verify the file is saved

### Dependencies Issues

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [Vue 3 Documentation](https://vuejs.org/)
- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
- [Vue Router](https://router.vuejs.org/)
- [Pinia State Management](https://pinia.vuejs.org/)

## 🎯 Next Steps

1. Open a Vue component in `frontend/src/`
2. Make a small change (e.g., edit some text)
3. Save and watch it update instantly in your browser
4. Keep iterating until the UI is perfect! 🎨✨

Happy coding! 🚀
