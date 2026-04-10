# 🎙️ Discord Voice Recorder Client

이 프로젝트는 Discord 음성 채널에서 오디오를 캡처하여 `.wav` 형식으로 변환하고, 원격 서버로 업로드하여 AI(Whisper & Ollama)를 통해 자동 텍스트 변환(STT) 및 요약을 수행하는 **듀얼 컴포넌트 시스템**입니다.

---

## 📌 프로젝트 개요 (Project Overview)

사용자가 Discord 음성 채널에 참여하면, 클라이언트가 해당 오디오 스트림을 감지하여 녹음합니다. 녹음이 완료되면 서버로 파일을 전송하며, 서버는 AI 모델을 사용하여 음성을 텍스트로 변환하고 내용을 분석합니다.

- **핵심 기능**:
  - Discord 음성 채널 참여/퇴장 자동 감지.
  - FFmpeg를 이용한 실시간 오디오 스트림의 `.wav` 변환.
  - Whisper(STT) 및 Ollama(LLM)를 활용한 자동 전사 및 요약.
  - 클라이언트-서버 간의 파일 업로드 파이프라인 구축.

---

## 🛠 기술 스택 (Tech Stack)

### **Client (Capture Side)**
- **Runtime**: Node.js
- **Library**: `discord.js`, `@discordjs/voice`, `fluent-ffmpeg`, `axios`, `dotenv`
- **Role**: Discord 연결 유지, 오디오 스트림 캡처, FFmpeg를 이용한 포맷 변환, 서버로 파일 업로드.

### **Server (Processing Side)**
- **Runtime**: Node.js (Express)
- **Library**: `express`, `multer`, `axios`
- **AI Engine**: 
  - **OpenAI Whisper**: 음성 파일을 텍스트로 변환(STT).
  - **Ollama (Llama 3)**: 변환된 텍스트를 분석 및 요약.
- **Role**: 클라이언트로부터 오디오 수신, AI 모델 실행, 처리 결과 반환.

---

## 🚀 초기 설정법 (Initial Setup)

### **1. 사전 요구 사항**
- [Node.js](https://nodejs.org/) 설치
- [FFmpeg](https://ffmpeg.org/) 설치 (시스템 PATH에 등록 필수)
- [Ollama](httpsorg/ollama) 설치 및 실행 중이어 (`http://192.168.1.6:11434` 기준)
- (선선택 사항) `whisper` CLI 도구 설치

### **2. 클라이언트 설정 (Client Setup)**
1. `cd client`
2. `npm install`
3. `.env` 파일 생성 및 환경 변수 설정:
   ```env
   DISCORD_TOKEN=your_discor_bot_token_here
   SERVER_URL=http://<server-ip>:3000/upload
   ```
4. `node index.js` 실행

### **3. 서버 설정 (Server Setup)**
1. `cd server`
2. `npm install`
3. 서버 실행: `node index.js`

---

## ⚙️ 환경 변수 (Environment Variables)

### **Client (`client/.env`)**
| 변수명 | 설명 | 필수 여부 |
| :--- | :--- | :---: |
| `DISCORD_TOKEN` | Discord Bot의 인증 토큰 | ✅ 필수 |
| `SERVER_URL` | 오디오를 업로드할 서버의 엔드포인트 (예: `http://localhost:3000/upload`) | ✅ 필수 |

### **Server Configuration**
서버는 기본적으로 시스템에 설치된 `whisper` 명령어를 호출하며, Ollama API 주소는 코드 내에 지정되어 있습니다. (환경에 따라 `server/index.js` 내부의 IP 주소를 수정해야 할 수 있습니다.)

---

## 🔄 작동 흐름 (Workflow)

1. **사용자 참여**: 사용자가 Discord 음성 채널에 접속.
2. **캡처 시작**: 클라이언트가 오디오 스트림을 감지하고 `audioProcessor.js`를 통해 `.wav`로 저장.
3. **사용자 퇴장**: 사용자가 채널을 나가면 녹음 종료 및 파일 생성 완료.
4. **업로드**: 클라이언트가 `axios`를 사용하여 서버의 `/upload` 엔드포인트로 `.wav` 파일을 전송.
5. **AI 처리**: 
   - 서버에서 `whisper`를 호출하여 텍스트 추출.
   - 추출된 텍스트를 `Ollama`에 전달하여 요약 생성.
6. **결과 반환**: 클라이언트에 최종 텍스트 및 분석 결과 응답.

---

## 📂 디렉토리 구조 (Directory Structure)

```text
discord-voice-recorder/
├── client/                 # 클라이언트 프로젝트
│   ├── index.js            # Discord Bot 로직 및 오디오 캡처
│   ├── utils/             # 오디오 처리 유틸리티
│   └── package.json
├── server/                 # 서버 프로젝트
│   ├── index.js            # Express 서버 및 AI 연동 로직
│   ├── uploads/            # 업로드된 파일 저장 폴더
│   └── package.json
├── integration_test.sh      # E2E 테스트 스크립트
└── .gitignore             # 제외할 파일 설정
```
