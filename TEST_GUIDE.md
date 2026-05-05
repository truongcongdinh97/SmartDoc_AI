# 🧪 Hướng Dẫn Test SmartDoc AI

## 📋 Mục Lục

1. [Chuẩn Bị](#chuẩn-bị)
2. [Cài Đặt Môi Trường](#cài-đặt-môi-trường)
3. [Khởi Động Backend](#khởi-động-backend)
4. [Khởi Động Frontend](#khởi-động-frontend)
5. [Test Scenarios](#test-scenarios)
6. [Kiểm Tra Output](#kiểm-tra-output)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Chuẩn Bị

### Yêu cầu hệ thống:
- **OS:** Windows 11/10, macOS, hoặc Linux
- **Python:** 3.10+ (Backend)
- **Node.js:** 16+ (Frontend)
- **Ollama:** Đã cài đặt và có models
- **RAM:** Tối thiểu 8GB (khuyến nghị 16GB)
- **Disk:** 2GB+ cho dependencies

### Tệp tin cần thiết:
- Backend: `backend/app.py`, `backend/requirements.txt`
- Frontend: `frontend/public/app.js`, `frontend/public/index.html`
- Test file: `test/ARTIFICIAL INTELLIGENCE.pdf` (hoặc PDF khác)

---

## 🚀 Cài Đặt Môi Trường

### Bước 1: Cài đặt Backend Dependencies

```bash
# Di chuyển vào thư mục backend
cd H:/Develop/SmartDoc_AI/backend

# Tạo virtual environment (khuyến nghị)
python -m venv venv

# Kích hoạt virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt
```

### Bước 2: Cài đặt Frontend Dependencies

```bash
# Di chuyển vào thư mục frontend
cd H:/Develop/SmartDoc_AI/frontend

# Cài đặt dependencies
npm install
```

### Bước 3: Cài đặt Ollama Models

```bash
# Đảm bảo Ollama đang chạy
ollama serve

# Mở terminal khác và cài đặt models
ollama pull gemma4:e2b
ollama pull nomic-embed-text:latest

# Kiểm tra models đã cài
ollama list
```

---

## 🖥️ Khởi Động Backend

### Phương pháp 1: Direct Python (Development)

```bash
# Kích hoạt virtual environment (nếu chưa kích hoạt)
cd H:/Develop/SmartDoc_AI/backend
venv\Scripts\activate  # Windows

# Khởi động server
python app.py
```

**Expected Output:**
```
INFO - __main__ - Available models: ['gemma4:e2b', 'nomic-embed-text:latest']
INFO - __main__ - Refinement endpoints loaded
INFO - __main__ - Starting Flask server on port 5000...
 * Running on http://127.0.0.1:5000
```

### Phương pháp 2: PyInstaller (Production)

```bash
# Build executable
cd H:/Develop/SmartDoc_AI/backend
pyinstaller --onefile app.py

# Chạy executable
dist/app.exe
```

### Kiểm tra Backend Health

```bash
# Mở browser hoặc curl
curl http://127.0.0.1:5000/api/health

# Expected Response:
{
  "status": "healthy",
  "ollama_running": true
}
```

---

## 🖱️ Khởi Động Frontend

### Phương pháp 1: npm start (Development)

```bash
# Di chuyển vào thư mục frontend
cd H:/Develop/SmartDoc_AI/frontend

# Build React (nếu chưa build)
node build-react.js

# Khởi động Electron
npm start
```

### Phương pháp 2: Direct Electron

```bash
# Build React (nếu chưa build)
cd H:/Develop/SmartDoc_AI/frontend
node build-react.js

# Khởi động Electron trực tiếp
electron .
```

### Phương pháp 3: npm run build (Production)

```bash
# Build Electron app
cd H:/Develop/SmartDoc_AI/frontend
npm run build

# Installer sẽ được tạo trong dist/
```

---

## 🧪 Test Scenarios

### 📥 Tab 1: Tiếp nhận & Quét

#### Test 1.1: Upload PDF File
1. Mở ứng dụng Electron
2. Chọn Tab 1 "Tiếp nhận & Quét"
3. Click "Chọn PDF File"
4. Chọn file: `test/ARTIFICIAL INTELLIGENCE.pdf`
5. Click "Xử lý & Lưu"
6. Quan sát progress bar và notifications

**Expected Behavior:**
- ✅ Progress bar chạy từ 0% → 100%
- ✅ Toast notification: "Đang xử lý: ARTIFICIAL INTELLIGENCE.pdf"
- ✅ Toast notification: "Đã xử lý thành công: ARTIFICIAL INTELLIGENCE.pdf" (success)
- ✅ Tự động chuyển sang Tab 2
- ✅ File xuất hiện trong danh sách processed files

#### Test 1.2: Upload Multiple Files
1. Quay lại Tab 1
2. Upload thêm 2-3 PDF files khác
3. Quan sát processed files list

**Expected Behavior:**
- ✅ Mỗi file được xử lý riêng biệt
- ✅ Progress bar hiển thị "X/3 files"
- ✅ Success/failure status cho mỗi file
- ✅ Tổng số files được cập nhật

#### Test 1.3: Error Handling
1. Thử upload file không hợp lệ (ví dụ: .txt, .jpg)
2. Quan sát error messages

**Expected Behavior:**
- ✅ Error toast notification xuất hiện
- ✅ Error message rõ ràng: "Unsupported file type"
- ✅ File không được thêm vào danh sách

---

### 📝 Tab 2: Kiểm duyệt & Chỉnh sửa

#### Test 2.1: View Document Preview
1. Chọn Tab 2 "Kiểm duyệt & Chỉnh sửa"
2. Chọn file từ sidebar: "ARTIFICIAL INTELLIGENCE.pdf"
3. Quan sát document preview

**Expected Behavior:**
- ✅ Markdown content hiển thị trong preview pane
- ✅ Metadata hiển thị (filename, file size, page count)
- ✅ Wing classification hiển thị

#### Test 2.2: AI Assistant - Tóm tắt
1. Click button "📝 Tóm tắt"
2. Quan sát loading state
3. Đợi AI response

**Expected Behavior:**
- ✅ Button hiển thị "⏳ Đang xử lý..."
- ✅ Loading spinner xuất hiện
- ✅ Toast notification: "Đang tóm tắt tài liệu..."
- ✅ AI response hiển thị trong formatted box
- ✅ Summary ngắn gọn, dễ hiểu

#### Test 2.3: AI Assistant - Viết lại trang trọng
1. Click button "✨ Viết lại trang trọng"
2. Quan sát loading state
3. Đợi AI response

**Expected Behavior:**
- ✅ Button disabled khi đang processing
- ✅ AI response hiển thị với formal tone
- ✅ Markdown content được giữ nguyên structure
- ✅ Văn phong chuyên nghiệp hơn

#### Test 2.4: AI Assistant - Yêu cầu tùy chỉnh
1. Nhập instruction: "Viết lại dưới dạng bullet points"
2. Click button "🔧 Chỉnh sửa theo yêu cầu"
3. Quan sát loading state
4. Đợi AI response

**Expected Behavior:**
- ✅ Custom instruction được gửi lên backend
- ✅ AI response tuân theo instruction
- ✅ Content được chuyển thành bullet points
- ✅ Toast notification success

#### Test 2.5: Edit Document
1. Edit markdown content trong textarea
2. Click "💾 Lưu thay đổi"
3. Quan sát notification

**Expected Behavior:**
- ✅ Changes được lưu
- ✅ Toast notification: "Đã lưu thay đổi"
- ✅ Content được cập nhật trong database

#### Test 2.6: Error Handling
1. Tắt Ollama (Ctrl+C trong terminal chạy ollama)
2. Thử sử dụng AI assistant
3. Quan sát error messages

**Expected Behavior:**
- ✅ Error toast notification: "Không thể kết nối tới AI"
- ✅ Error message có thể dismiss
- ✅ UI không crash

---

### 💬 Tab 3: Tra cứu & Hỏi đáp

#### Test 3.1: Chat with AI - No Wing Filter
1. Chọn Tab 3 "Tra cứu & Hỏi đáp"
2. Nhập câu hỏi: "Tài liệu này nói về gì?"
3. Click "Gửi"
4. Quan sát chat response

**Expected Behavior:**
- ✅ User message xuất hiện bên phải
- ✅ AI response xuất hiện bên trái
- ✅ Loading state: "AI đang suy nghĩ..."
- ✅ AI trả lời dựa trên tài liệu
- ✅ Sources hiển thị (nếu có)
- ✅ Footer hiển thị số tài liệu

#### Test 3.2: Chat with AI - Wing Filter
1. Click wing button (ví dụ: "omniscience_wiki")
2. Nhập câu hỏi: "Tìm thông tin về AI"
3. Click "Gửi"
4. Quan sát response

**Expected Behavior:**
- ✅ Wing filter được active (highlight)
- ✅ AI chỉ tìm kiếm trong wing đã chọn
- ✅ Response có source citations
- ✅ Source hiển thị filename và chunk

#### Test 3.3: Multiple Questions
1. Đặt thêm 2-3 câu hỏi khác nhau
2. Quan sát chat history

**Expected Behavior:**
- ✅ Mỗi câu hỏi được xử lý riêng
- ✅ Chat history được giữ nguyên
- ✅ Scrollable nếu nhiều messages
- ✅ Sources hiển thị cho mỗi response

#### Test 3.4: Clear Chat
1. Click button "🗑️ Xóa lịch sử"
2. Quan sát chat area

**Expected Behavior:**
- ✅ Tất cả messages bị xóa
- ✅ Chat area trống
- ✅ Welcome message xuất hiện lại
- ✅ Notification: "Đã xóa lịch sử chat"

#### Test 3.5: Error Handling
1. Tắt backend server
2. Thử gửi câu hỏi
3. Quan sát error messages

**Expected Behavior:**
- ✅ Error toast notification
- ✅ Error message: "Không thể kết nối tới backend"
- ✅ UI không crash

---

## ✅ Kiểm Tra Output

### Backend Logs

**Kiểm tra file: `backend/logs/server.log`**

**Expected Logs:**
```log
2026-05-05 14:00:00 - __main__ - INFO - Available models: ['gemma4:e2b', 'nomic-embed-text:latest']
2026-05-05 14:00:01 - __main__ - INFO - Refinement endpoints loaded
2026-05-05 14:00:01 - __main__ - INFO - Starting Flask server on port 5000...
2026-05-05 14:01:30 - __main__ - INFO - Processing file: ARTIFICIAL INTELLIGENCE.pdf
2026-05-05 14:01:35 - __main__ - INFO - Document processed successfully
2026-05-05 14:01:36 - __main__ - INFO - Classified wing: omniscience_wiki
2026-05-05 14:01:36 - __main__ - INFO - Embedded 15 chunks
2026-05-05 14:02:00 - __main__ - INFO - RAG query: "Tài liệu này nói về gì?"
2026-05-05 14:02:05 - __main__ - INFO - Found 5 relevant documents
```

### Database Files

**Kiểm tra thư mục: `backend/data/`**

**Expected Files:**
```
backend/data/
├── lancedb/               # Vector database
│   ├── omniscience_wiki/
│   ├── code_chronicles/
│   ├── tcdserver/
│   ├── openclaw/
│   ├── robotics/
│   └── conversation/
└── storage.json          # Document metadata
```

### Frontend Console

**Mở DevTools trong Electron (Ctrl+Shift+I)**

**Expected Console:**
```
SmartDoc AI loaded successfully!
Backend status: healthy
Ollama status: running
Documents loaded: 3
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Backend không khởi động

**Problem:**
```
Error: Ollama is not running!
```

**Solution:**
```bash
# Khởi động Ollama
ollama serve

# Mở terminal khác và verify
curl http://localhost:11434/api/tags
```

#### 2. Models không có sẵn

**Problem:**
```
Error: Gemma 4 not found!
```

**Solution:**
```bash
# Pull models
ollama pull gemma4:e2b
ollama pull nomic-embed-text:latest

# Verify
ollama list
```

#### 3. Frontend không kết nối được backend

**Problem:**
```
Error: Cannot connect to backend
```

**Solution:**
```bash
# Kiểm tra backend đang chạy
curl http://127.0.0.1:5000/api/health

# Kiểm tra CORS headers
# Đảm bảo CORS đã enabled trong app.py
```

#### 4. PDF processing lỗi

**Problem:**
```
Error: Unable to process PDF
```

**Solution:**
```bash
# Kiểm tra file PDF có hợp lệ không
# Thử với file PDF khác

# Cài đặt lại dependencies
pip install --upgrade docling pypdf
```

#### 5. Electron không khởi động

**Problem:**
```
Error: Electron not found
```

**Solution:**
```bash
# Cài đặt lại dependencies
cd H:/Develop/SmartDoc_AI/frontend
npm install

# Rebuild React
node build-react.js

# Khởi động lại
npm start
```

---

## 📝 Test Checklist

### Backend Test Checklist
- [ ] Ollama đang chạy
- [ ] Models đã cài (gemma4:e2b, nomic-embed-text)
- [ ] Dependencies đã cài
- [ ] Server khởi động thành công
- [ ] Health endpoint hoạt động
- [ ] Database files được tạo

### Frontend Test Checklist
- [ ] Electron khởi động thành công
- [ ] React build thành công
- [ ] Kết nối được backend
- [ ] Tabs hoạt động
- [ ] Notifications hiển thị
- [ ] Keyboard shortcuts hoạt động

### Functional Test Checklist
- [ ] Upload PDF thành công
- [ ] PDF được process thành công
- [ ] Metadata được extract
- [ ] Wing classification hoạt động
- [ ] Embeddings được tạo
- [ ] AI assistant hoạt động
- [ ] RAG chat hoạt động
- [ ] Wing filter hoạt động
- [ ] Sources hiển thị
- [ ] Edit document hoạt động
- [ ] Error handling hoạt động

### UI/UX Test Checklist
- [ ] Responsive design
- [ ] Smooth animations
- [ ] Loading states
- [ ] Toast notifications
- [ ] Focus states
- [ ] Keyboard navigation
- [ ] Status indicators
- [ ] Progress bars

---

## 🎯 Success Criteria

App được coi là test thành công nếu:

✅ Backend khởi động và chạy ổn định
✅ Frontend khởi động và kết nối được backend
✅ Upload PDF và process thành công
✅ AI assistant (summarize, formalize, custom) hoạt động
✅ RAG chat trả lời được câu hỏi
✅ Wing filter hoạt động
✅ Sources hiển thị đúng
✅ Error handling hoạt động
✅ UI/UX smooth và professional
✅ Keyboard shortcuts hoạt động

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra backend logs: `backend/logs/server.log`
2. Kiểm tra frontend console (DevTools)
3. Xem Troubleshooting section
4. Mở issue trên GitHub

---

**Last Updated:** 2026-05-05 14:00

**Test Version:** v1.0

**Wing:** smartdoc_testing