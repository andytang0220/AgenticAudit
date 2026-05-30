# Setup Guide - AgenticAudit Backend

Complete setup instructions for the Compliance Monitoring Agent backend.

## 📋 Prerequisites

- **Python:** 3.11 or higher
- **pip:** Python package manager
- **git:** Version control

### Check Prerequisites

```bash
python --version          # Should be 3.11+
pip --version            # Should be 21.0+
git --version            # Any recent version
```

---

## 🚀 Local Development Setup

### Step 1: Clone and Navigate

```bash
cd lablab.ai
```

### Step 2: Create Virtual Environment

Create an isolated Python environment for this project:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` prefix in your terminal.

### Step 3: Install Dependencies

```bash
pip install -r Backend/requirements.txt
```

This installs:
- FastAPI (web framework)
- Uvicorn (ASGI server)
- Pydantic (data validation)
- pytest (testing framework)
- And other development tools

### Step 4: Verify Installation

```bash
python -c "import fastapi; print(f'FastAPI {fastapi.__version__}')"
```

### Step 5: Run Backend Server

```bash
cd Backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Output should show:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Reloading detected...
```

### Step 6: Test API

In a new terminal (keep server running):

```bash
# Health check
curl http://localhost:8000/health

# Get mock compliance alerts
curl http://localhost:8000/api/v1/compliance-alerts

# Open interactive docs
# Visit: http://localhost:8000/docs
```

---

##  Configuration

### Environment Variables

Copy the example file:

```bash
cp Backend/.env.example Backend/.env
```

Edit `Backend/.env` to customize settings:

```env
ENVIRONMENT=development
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

See [Backend/config.py](Backend/config.py) for all available options.

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Python 3.11+ installed: `python --version`
- [ ] Virtual environment activated: `(venv)` visible in terminal
- [ ] Dependencies installed: No errors from `pip install`
- [ ] Backend running: `uvicorn main:app --reload`
- [ ] Health endpoint works: `curl http://localhost:8000/health`
- [ ] Swagger UI accessible: http://localhost:8000/docs
- [ ] Mock alerts available: `curl http://localhost:8000/api/v1/compliance-alerts`

---

## 📚 Next Steps

### For Frontend Team
1. Start building dashboard UI
2. Use http://localhost:8000/docs for interactive API testing
3. Fetch data from GET /api/v1/compliance-alerts

### For Bright Data Team
1. Test POST /api/v1/ingest-scrape endpoint
2. Send sample HTML payloads
3. Track job status with GET /api/v1/jobs/{job_id}

### For RAG/AI Team
1. Review `process_rag_analysis()` in [Backend/main.py](Backend/main.py#L92)
2. Understand integration points marked with `# TODO`
3. Implement RAG logic where indicated

---

## 🧪 Running Tests

```bash
# Run all tests
pytest Backend/tests/ -v

# Run specific test file
pytest Backend/tests/test_endpoints.py -v

# Run specific test
pytest Backend/tests/test_endpoints.py::TestHealthCheck::test_health_check_returns_200 -v

# Run with coverage
pytest Backend/tests/ --cov=Backend --cov-report=html
```

Generated coverage report: `htmlcov/index.html`

---

## 🔧 Development Tools

### Code Formatting

```bash
# Format all Python files
black Backend/

# Sort imports
isort Backend/
```

### Linting

```bash
# Check for code issues
flake8 Backend/

# Type checking
mypy Backend/
```

### Full Quality Check

```bash
# Format code
black Backend/
isort Backend/

# Run linting
flake8 Backend/

# Run type checking
mypy Backend/

# Run tests
pytest Backend/
```

---

## 📊 Project Structure After Setup

```
lablab.ai/
├── Backend/
│   ├── __pycache__/          # Auto-generated
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_endpoints.py # Test suite
│   ├── main.py               # FastAPI app (START HERE)
│   ├── models.py             # Data models
│   ├── config.py             # Configuration
│   ├── __init__.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env                  # Your local config (create from .env.example)
│   └── README.md
├── venv/                     # Virtual environment (created by setup)
├── pyproject.toml
├── .gitignore
├── README.md
├── SETUP.md                  # This file
└── INTEGRATION.md            # Team integration guide
```

---

## 🐛 Troubleshooting

### Issue: "python command not found"
**Solution:** Python might not be in PATH. Try `python3` or use full path to Python executable.

### Issue: "Permission denied" on venv activation
**Solution:** Run PowerShell as Administrator or use `python -m venv venv` differently.

### Issue: "ModuleNotFoundError: No module named 'fastapi'"
**Solution:** 
1. Ensure virtual environment is activated: `(venv)` should show in terminal
2. Reinstall dependencies: `pip install -r Backend/requirements.txt`

### Issue: "Port 8000 already in use"
**Solution:** 
```bash
# Use different port
uvicorn main:app --port 8001

# Or kill process using port 8000 (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Issue: Swagger UI not loading at /docs
**Solution:**
1. Check server is running: `uvicorn main:app --reload`
2. Verify URL: http://localhost:8000/docs
3. Check browser console for errors (F12)

---

## 📞 Getting Help

### Documentation
- **FastAPI:** https://fastapi.tiangolo.com/
- **Pydantic:** https://docs.pydantic.dev/
- **Uvicorn:** https://www.uvicorn.org/

### In This Project
- **API Docs:** http://localhost:8000/docs
- **Backend README:** [Backend/README.md](Backend/README.md)
- **Project README:** [README.md](README.md)

---

## ✨ What's Next?

The backend scaffolding is complete! You can now:

1. **Frontend team** → Start building UI with mock data
2. **Bright Data team** → Test scraper integration with POST endpoint
3. **RAG/AI team** → Implement compliance analysis logic
4. **All teams** → Use Swagger UI to test endpoints: http://localhost:8000/docs

Happy coding! 🚀
