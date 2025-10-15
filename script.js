let recognition;
let finalTranscript = '';
let recognizing = false;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'zh-TW';

  recognition.onstart = () => {
    recognizing = true;
    console.log("🎙️ 語音辨識啟動");
  };

  recognition.onerror = (event) => {
    console.error("❌ 辨識錯誤：", event.error);
  };

  recognition.onend = () => {
    recognizing = false;
    console.log("🛑 語音辨識結束，嘗試自動重啟");
    // 自動重啟辨識（若不是手動停止）
    if (shouldAutoRestart) {
      recognition.start();
    }
  };

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + '\n';
      } else {
        interim += transcript;
      }
    }
    document.getElementById('rawText').value = finalTranscript;
    document.getElementById('live').textContent = interim;
  };
} else {
  alert('❌ 你的瀏覽器不支援語音辨識，請使用 Chrome 桌機版');
}

let shouldAutoRestart = false;

document.getElementById('start').onclick = () => {
  finalTranscript = '';
  document.getElementById('rawText').value = '';
  document.getElementById('live').textContent = '...錄音中';
  shouldAutoRestart = true;
  recognition.start();
};

document.getElementById('stop').onclick = () => {
  shouldAutoRestart = false;
  recognition.stop();
  document.getElementById('live').textContent = '(已停止)';
};

document.getElementById('copyMd').onclick = () => {
  const rawText = document.getElementById('rawText').value;
  const mdText = "## 📚 自動筆記（Markdown）\n\n" + rawText.split('\n')
    .filter(line => line.trim())
    .map(line => `- ${line.trim()}`)
    .join('\n');
  navigator.clipboard.writeText(mdText)
    .then(() => alert("✅ 已複製 Markdown 筆記"))
    .catch(() => alert("❌ 複製失敗"));
};
