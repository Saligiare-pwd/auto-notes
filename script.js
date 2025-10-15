let recognition;
let finalTranscript = '';
let subtitleSegments = [];
let recognizing = false;
let shouldAutoRestart = false;
let mediaRecorder;
let audioChunks = [];

async function translateText(text, targetLang = 'en') {
  const res = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + targetLang + "&dt=t&q=" + encodeURIComponent(text));
  const data = await res.json();
  return data[0].map(item => item[0]).join("");
}

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'zh-TW'; // 中英混合

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

  recognition.onresult = async (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        const original = transcript.trim();
        const translated = await translateText(original, 'en');
        subtitleSegments.push({ original, translated });
        finalTranscript = subtitleSegments.map((s, i) =>
          `(${i + 1}) ${s.original}\n    → ${s.translated}`).join("\n");
      } else {
        interim = transcript;
      }
    }

    const interimLine = interim ? `\n>> ${interim}` : '';
    document.getElementById('rawText').value = finalTranscript;
    document.getElementById('subtitleArea').textContent =
      subtitleSegments.map((s, i) =>
        `(${i + 1}) ${s.original}\n    → ${s.translated}`).join('\n') + interimLine;
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
  subtitleSegments = [];
  document.getElementById('rawText').value = '';
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

document.getElementById('stop').onclick = () => {
  shouldAutoRestart = false;
  recognition.stop();
  document.getElementById('subtitleArea').textContent += '\n(已停止錄音)';
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
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
  const text = subtitleSegments.map(s => `- ${s.original}\n  → ${s.translated}`).join("\n");
  const md = "## 📚 即時翻譯筆記\n\n" + text;
  navigator.clipboard.writeText(md)
    .then(() => alert("✅ 已複製 Markdown 筆記"))
    .catch(() => alert("❌ 複製失敗"));
};
