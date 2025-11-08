# 🎨 Quick Start - UI Development

Welcome! This guide will get you developing the UI in less than 5 minutes.

## Option 1: GitHub Codespaces (Recommended) ⭐

The fastest way to start developing:

1. **Click the button** to open in Codespaces:
   
   [![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/XS-Xspert-Software/Social-Media)

2. **Wait** for the automatic setup (~2 minutes)

3. **Start coding**! The dev server starts automatically at port 5173

4. **See changes instantly** with hot module replacement (HMR)

📖 **[Full Codespaces Guide →](CODESPACES.md)**

## Option 2: Local Development with Docker

If you prefer to work locally:

```bash
# Clone the repository
git clone https://github.com/XS-Xspert-Software/Social-Media.git
cd Social-Media

# Start the UI development environment
./dev-ui.sh
```

The frontend will be available at: http://localhost:5173

## Option 3: Manual Setup

```bash
# Start all services
docker compose up -d

# In a new terminal, start the frontend
cd frontend
npm install
npm run dev
```

## 🔥 Hot Module Replacement

Once the dev server is running:

1. **Edit** any file in `frontend/src/`
2. **Save** (Ctrl+S or Cmd+S) 
3. **See changes instantly** in your browser!

No build step. No manual refresh. Just code and see results! ✨

## 📁 Key Directories

```
frontend/src/
├── App.vue          # Main app component
├── Posts.vue        # Posts feed
├── Chat.vue         # Chat interface  
├── Videos.vue       # Video player
├── router/          # Page routing
├── stores/          # State management
└── components/      # Reusable UI components
```

## 💡 Development Tips

### VS Code Tasks (Codespaces)

Press `Ctrl+Shift+P` → "Tasks: Run Task" → Select:
- **Start UI Dev Server** - Start just the frontend
- **Start All Services** - Start the full stack
- **Build Frontend** - Create production build

### Auto-Save

In Codespaces, auto-save is enabled by default. Changes save automatically after 1 second!

### Browser DevTools

Press `F12` in your browser to:
- **Inspect elements** and CSS
- **Debug JavaScript** with breakpoints
- **Monitor network** requests
- **Check console** for errors

### Vue DevTools

Install the [Vue DevTools browser extension](https://devtools.vuejs.org/) for:
- Component hierarchy inspection
- State management debugging  
- Performance profiling
- Event tracking

## 🆘 Need Help?

- **Setup issues?** Run `./validate-setup.sh` to check your configuration
- **HMR not working?** Try setting `VITE_USE_POLLING=true`
- **Port conflicts?** Check if port 5173 is already in use

## 🎯 Your First Change

Try this now:

1. Open `frontend/src/App.vue`
2. Find any text in the template
3. Change it to something else
4. Save the file
5. Watch it update instantly in your browser! 🎉

---

**Happy coding!** 🚀
