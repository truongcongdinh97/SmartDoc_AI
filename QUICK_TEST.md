# 🚀 Hướng Dẫn Test Nhanh SmartDoc AI

## 📌 Pre-flight Checklist

Trước khi test, đảm bảo:
- [ ] Python 3.10+ đã cài ✅
- [ ] Node.js 16+ đã cài ✅
- [ ] Ollama đã cài ✅
- [ ] Backend dependencies đã cài ✅ (just done!)
- [ ] Frontend đã build ✅ (already built)

---

## ⚡ QUICK START (5 phút)

### Bước 1: Start Ollama

Mở terminal mới và chạy:

```bash
ollama serve
```

**Giữ terminal này mở!** Ollama cần chạy liên tục.

---

### Bước 2: Check Ollama Models

Mở terminal mới và chạy:

```bash
ollama list
```

**Expected Output:**
```
NAME                  ID              SIZE      MODIFIED
gemma4:e2b            <hash>          2.7 GB    <date>
nomic-embed-text:latest <hash>          274 MB    <date>
```

**Nếu không có models, chạy:**
```bash
ollama pull gemma4:e2b
ollama pull nomic-embed-text:latest
```

---

### Bước 3: Start Backend

Mở terminal mới và chạy:

```bash
cd H:/Develop/SmartDoc_AI/backend
python app.py
```

**Expected Output:**
```
2026-05-05 14:00:00 - __main__ - INFO - Available models: ['gemma4:e2b', 'nomic-embed-text:latest']
2026-05-05 14:00:01 - __main__ - INFO - Refinement endpoints loaded
2026-05-05 14:00:01 - __main__ - INFO - Starting Flask server on port 5000...
 * Running on http://127.0.0.1:5000
```

**Backend đang chạy! Giữ terminal mở!**

---

### Bước 4: Start Frontend (Electron)

Mở terminal mới và chạy:

```bash
cd H:/Develop/SmartDoc_AI/frontend
npm start
```

**Electron window sẽ mở!**

---

## 🧪 TEST SCENARIOS (10 phút)

### Test 1: Upload & Process PDF (2 phút)

1. Trong Electron app, chọn **Tab 1: Tiếp nhận & Quét**
2. Click **"Chọn PDF File"**
3. Chọn file: `test/ARTIFICIAL INTELLIGENCE.pdf`
4. Click **"Xử lý & Lưu"**
5. Quan sát:
   - ✅ Progress bar chạy
   - ✅ Toast notification xuất hiện
   - ✅ Tự động chuyển sang Tab 2

**Success!** PDF đã được process thành công.

---

### Test 2: AI Assistant - Tóm Tắt (3 phút)

1. Trong **Tab 2: Kiểm duyệt & Chỉnh sửa**
2. File đã chọn sẵn: "ARTIFICIAL INTELLIGENCE.pdf"
3. Click **"📝 Tóm tắt"**
4. Quan sát:
   - ✅ Button hiển thị "⏳ Đang xử lý..."
   - ✅ Toast notification xuất hiện
   - ✅ AI response hiển thị

**Success!** AI assistant đã tóm tắt tài liệu.

---

### Test 3: RAG Chat (5 phút)

1. Chọn **Tab 3: Tra cứu & Hỏi đáp**
2. Nhập câu hỏi: **"Tài liệu này nói về gì?"**
3. Click **"Gửi"**
4. Quan sát:
   - ✅ User message xuất hiện
   - ✅ AI response xuất hiện với sources
   - ✅ Sources hiển thị filename và chunk

**Success!** RAG chat đang hoạt động.

---

## ✅ SUCCESS CRITERIA

Bạn đã test thành công nếu:

- [x] Ollama đang chạy
- [x] Backend server đang chạy trên port 5000
- [x] Electron app đã mở
- [x] PDF được upload và process thành công
- [x] AI assistant (tóm tắt) hoạt động
- [x] RAG chat trả lời câu hỏi với sources

---

## 🐛 TROUBLESHOOTING

### Problem: "Ollama is not running!"

**Solution:**
```bash
# Mở terminal mới và start Ollama
ollama serve
```

---

### Problem: "Models not found"

**Solution:**
```bash
# Pull required models
ollama pull gemma4:e2b
ollama pull nomic-embed-text:latest
```

---

### Problem: "ModuleNotFoundError"

**Solution:**
```bash
# Reinstall backend dependencies
pip install -r H:/Develop/SmartDoc_AI/backend/requirements.txt
```

---

### Problem: "Cannot connect to backend"

**Solution:**
```bash
# Check backend is running
curl http://127.0.0.1:5000/api/health

# Expected response:
# {"status": "healthy", "ollama_running": true}
```

---

### Problem: "Electron not found"

**Solution:**
```bash
# Reinstall frontend dependencies
cd H:/Develop/SmartDoc_AI/frontend
npm install
```

---

## 📊 EXPECTED RESOURCES

### Memory Usage

| Component | RAM | CPU |
|-----------|------|-----|
| Ollama | 2-4 GB | 20-50% |
| Backend (Python) | 500 MB - 1 GB | 5-15% |
| Frontend (Electron) | 300-500 MB | 5-10% |
| **Total** | **3-6 GB** | **30-75%** |

### Response Times

| Operation | Expected Time |
|-----------|----------------|
| PDF Processing | 10-30 seconds |
| AI Summary | 5-15 seconds |
| RAG Query | 3-10 seconds |
| Embedding | 5-20 seconds |

---

## 🎯 NEXT STEPS

Sau khi test thành công:

1. **Explore Features:**
   - Test AI assistant: Viết lại trang trọng, Yêu cầu tùy chỉnh
   - Test RAG: Wing filter, multiple questions
   - Test UI: Keyboard shortcuts (Alt+1/2/3)

2. **Test More Documents:**
   - Upload multiple PDFs
   - Test different file types (if supported)
   - Test large documents

3. **Report Issues:**
   - Document any bugs
   - Note performance issues
   - Suggest improvements

---

## 📝 TEST LOG

Trước khi test, ghi lại:

**System Info:**
- OS: ___________
- Python Version: ___________
- Node.js Version: ___________
- RAM: ___________
- CPU: ___________

**Test Results:**
- Test 1 (Upload PDF): ✅ / ❌
- Test 2 (AI Summary): ✅ / ❌
- Test 3 (RAG Chat): ✅ / ❌

**Issues Found:**
- ________________________
- ________________________
- ________________________

---

## 💡 TIPS

1. **Keep Terminals Open:**
   - Ollama terminal - keep open!
   - Backend terminal - keep open!
   - Frontend terminal - keep open!

2. **Monitor Logs:**
   - Backend logs: `backend/logs/server.log`
   - Frontend console: Ctrl+Shift+I in Electron

3. **Use Test File:**
   - Use provided `test/ARTIFICIAL INTELLIGENCE.pdf`
   - It's a reliable test document

4. **Be Patient:**
   - AI operations take time (5-30 seconds)
   - First run may be slower (model loading)

---

## 🆘 NEED HELP?

1. Check `TEST_GUIDE.md` for detailed instructions
2. Check backend logs: `backend/logs/server.log`
3. Check frontend console (DevTools)
4. Open issue on GitHub

---

**Last Updated:** 2026-05-05 14:00

**Test Version:** Quick Test v1.0

**Estimated Time:** 15-20 minutes