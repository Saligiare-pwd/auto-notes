let recognition;
let finalTranscript = '';
let subtitleSegments = [];
let recognizing = false;
let shouldAutoRestart = false;
let mediaRecorder;
let audioChunks = [];

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'zh-TW'; // 中英混合可辨識

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
    if (shouldAutoRestart) {
      console.log("🔁 自動重啟中...");
      recognition.start();
    }
  };

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        subtitleSegments.push(transcript.trim());
        finalTranscript = subtitleSegments.join("\n");
      } else {
        interim = transcript;
      }
    }
    document.getElementById('rawText').value = finalTranscript;
    document.getElementById('subtitleArea').textContent =
      subtitleSegments.join('\n') + (interim ? `\n>> ${interim}` : '');
  };
} else {
  alert('❌ 請使用支援語音辨識的 Chrome 瀏覽器');
}

document.getElementById('start').onclick = async () => {
  if (recognizing) {
    alert("⚠️ 已在錄音中，請先停止再重新開始");
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
    alert("⚠️ 尚未錄音或沒有音訊資料");
  }
};

document.getElementById('copyMd').onclick = () => {
  const text = subtitleSegments.map(s => `- ${s}`).join("\n");
  const md = "## 📚 課堂筆記字幕整理\n\n" + text;
  navigator.clipboard.writeText(md)
    .then(() => alert("✅ 已複製 Markdown 筆記"))
    .catch(() => alert("❌ 複製失敗"));
};
