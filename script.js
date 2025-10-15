let recognition;
let finalTranscript = '';

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'zh-TW';  // 中文為主，中英混合也可辨識

  recognition.onresult = function(event) {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      let transcript = event.results[i][0].transcript;
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
  alert('❌ 你的瀏覽器不支援語音辨識，請使用 Chrome');
}

document.getElementById('start').onclick = () => {
  finalTranscript = '';
  document.getElementById('rawText').value = '';
  document.getElementById('live').textContent = '...錄音中，請開始說話';
  recognition.start();
};

document.getElementById('stop').onclick = () => {
  recognition.stop();
  document.getElementById('live').textContent = '(已停止錄音)';
};

document.getElementById('copyMd').onclick = () => {
  const rawText = document.getElementById('rawText').value;
  const mdText = "## 📚 自動筆記（Markdown）\n\n" + rawText.split('\n')
    .filter(line => line.trim())
    .map(line => `- ${line.trim()}`)
    .join('\n');
  navigator.clipboard.writeText(mdText)
    .then(() => alert("✅ 已複製成 Markdown 條列筆記"))
    .catch(() => alert("❌ 複製失敗"));
};
