# YouTube RAG Assistant (Chrome Extension + FastAPI)

A Chrome Extension that lets you query YouTube videos using a Retrieval-Augmented Generation (RAG) backend.

---

## 🚀 Features

- Extracts **YouTube transcripts** using `youtube-transcript-api`
- Runs a **RAG (Retrieval-Augmented Generation) pipeline** for Q&A
- Chrome Extension frontend for user interaction
- FastAPI backend for processing queries

---

## 🔧 Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Huzaifa-A-Subhani/Youtube-RAG-Chrome-Extension.git
cd <Youtube-RAG-Chrome-Extension>

2️⃣ Backend Setup
# Create a virtual environment
python -m venv venv
source venv/bin/activate   # On Linux/Mac
venv\Scripts\activate      # On Windows

# Install dependencies
pip install -r requirements.txt

# Run the backend
uvicorn rag_backend:app --reload


3️⃣ Frontend(Chrome) Setup

1) Open Chrome and go to: chrome://extensions/
2)Enable Developer Mode (top right)
3)Click Load unpacked and select the project folder (10.CHROME_EXTENSION_PROJECT/)
4)The extension will now appear in your extensions list 🚀


📝 Usage

Open a YouTube video
Click on the extension icon
Ask your question in the popup
The extension will call the backend and display an answer 🎯
```
