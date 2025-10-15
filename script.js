let recognition;
let finalTranscript = '';
let recognizing = false;
let shouldAutoRestart = false;
let mediaRecorder;
let audioChunks = [];

async function translateWholeText(text, targetLang = 'en') {
  const res = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + targetLang + "&dt=t&q=" + encodeURIComponent(text));
  const data = await res.json();
  return data[0].map(item => item[0]).join("");
}

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'zh-TW';

  recognition.onstart = () => {
    recognizing = true;
    console.log("🎙️ 語音辨識開始");
  };

  recognition.onerror = (event) => {
    console.error("❌ 辨識錯誤：", event.error);
  };

  recognition.onend = () => {
    recognizing = false;
    console.log("🛑 語音辨識結束");
    if (shouldAutoRestart) recognition.start();
  };

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript.trim() + "\n";
      } else {
        interim = transcript;
      }
    }
    document.getElementById('rawText').value = finalTranscript;
    document.getElementById('subtitleArea').textContent = finalTranscript + (interim ? '\n>> ' + interim : '');
  };
} else {
  alert('❌ 你的瀏覽器不支援語音辨識，請使用 Chrome 桌機版');
}

document.getElementById('start').onclick = async () => {
  if (recognizing) {
    alert("⚠️ 錄音已在進行中，請先按『停止錄音』再重新開始！");
    return;
  }

  finalTranscript = '';
  document.getElementById('rawText').value = '';
  document.getElementById('translatedText').value = '';
  document.getElementById('subtitleArea').textContent = '...錄音中，請開始說話';
  shouldAutoRestart = true;
  recognition.start();

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = event => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };
  mediaRecorder.start();
};

document.getElementById('stop').onclick = async () => {
  shouldAutoRestart = false;
  recognition.stop();
  document.getElementById('subtitleArea').textContent += '\n(已停止錄音)';
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }

  const originalText = document.getElementById('rawText').value;
  if (originalText.trim()) {
    document.getElementById('translatedText').value = '🌐 翻譯中...請稍候';
    const translated = await translateWholeText(originalText);
    document.getElementById('translatedText').value = translated;
  }
};

document.getElementById('downloadAudio').onclick = () => {
  if (audioChunks.length > 0) {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'recording.webm';
    a.click();
    URL.revokeObjectURL(audioUrl);
  } else {
    alert("⚠️ 尚未錄音或沒有錄音資料");
  }
};

document.getElementById('copyMd').onclick = () => {
  const zh = document.getElementById('rawText').value.trim();
  const en = document.getElementById('translatedText').value.trim();
  const md = `## 📚 錄音筆記\n\n### 中文原文：\n${zh}\n\n### 英文翻譯：\n${en}`;
  navigator.clipboard.writeText(md)
    .then(() => alert("✅ 已複製 Markdown 筆記"))
    .catch(() => alert("❌ 複製失敗"));
};
