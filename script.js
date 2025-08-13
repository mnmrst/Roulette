(() => {
    const canvas = document.getElementById('roulette');
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
  
    let options = [
      { text: 'Apple', enabled: true },
      { text: 'Banana', enabled: true },
      { text: 'Orange', enabled: true },
      { text: 'Melon', enabled: true },
      { text: 'Grape', enabled: true },
      { text: 'Peach', enabled: true }
    ]; // 選択肢とその状態を保存
    let colors = []; // 選択肢ごとの色を保存
    
    // 動的に色を生成する関数
    function generateColors(count) {
      const colors = [];
      for (let i = 0; i < count; i++) {
        // HSL色空間を使用して均等に色を分布
        const hue = (i * 360 / count) % 360;
        const saturation = 80; // 固定値
        const lightness = 50;  // 固定値
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
      }
      return colors;
    }
  
    let angle = 0;
    let angularVelocity = 0;
    let animationId = null;
    const friction = 0.98;
    const resultDiv = document.getElementById('result');
    const startBtn = document.getElementById('startBtn');
    const optionsContainer = document.getElementById('optionsContainer');
    const newOptionInput = document.getElementById('newOptionInput');
    const addOptionBtn = document.getElementById('addOptionBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultActions = document.getElementById('resultActions');
    const disableResultOption = document.getElementById('disableResultOption');
    
    let resultsHistory = []; // 結果履歴を保存
    let currentResult = null; // 現在の結果を保存
    let autoDisableEnabled = false; // 自動無効化のトグル状態
  
    function drawRoulette(rot) {
      ctx.clearRect(0, 0, size, size);
      const enabledOptions = options.filter(option => option.enabled);
      const segments = enabledOptions.length;
      
      // 選択肢が1つの場合は円全体を描画
      if (segments === 1) {
        ctx.beginPath();
        ctx.arc(center, center, center - 10, 0, 2 * Math.PI);
        ctx.fillStyle = colors[0];
        ctx.fill();
        
        ctx.save();
        ctx.translate(center, center);
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.font = "16px sans-serif";
        ctx.fillText(enabledOptions[0].text, 0, 5);
        ctx.restore();
      } else if (segments > 1) {
        const arc = (2 * Math.PI) / segments;
  
        for(let i = 0; i < segments; i++) {
          const startAngle = i * arc + rot;
          const endAngle = startAngle + arc;
  
          ctx.beginPath();
          ctx.moveTo(center, center);
          ctx.arc(center, center, center - 10, startAngle, endAngle);
          ctx.closePath();
          ctx.fillStyle = colors[i];
          ctx.fill();
  
          ctx.save();
          ctx.translate(center, center);
          ctx.rotate(startAngle + arc / 2);
          ctx.textAlign = "right";
          ctx.fillStyle = "#fff";
          ctx.font = "16px sans-serif";
          ctx.fillText(enabledOptions[i].text, center - 20, 10);
          ctx.restore();
        }
      }
  
      // 中心の矢印
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.moveTo(center, 10);
      ctx.lineTo(center - 15, 40);
      ctx.lineTo(center + 15, 40);
      ctx.closePath();
      ctx.fill();
    }
  
    function animate() {
      if (angularVelocity > 0.002) {
        angle += angularVelocity;
        angularVelocity *= friction;
        drawRoulette(angle);
        animationId = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationId);
        animationId = null;
        angularVelocity = 0;
        showResult();
        startBtn.disabled = false;
      }
    }
  
    function showResult() {
      let normalizedAngle = angle % (2 * Math.PI);
      if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
  
      const enabledOptions = options.filter(option => option.enabled);
      const segments = enabledOptions.length;
      const arc = (2 * Math.PI) / segments;
      let index = Math.floor(((2 * Math.PI) - normalizedAngle + arc / 2) / arc) % segments;
  
      const result = enabledOptions[index].text;
      resultDiv.textContent = `Result: ${result}!`;
      
      // 現在の結果を保存
      currentResult = result;
      
      // 結果アクションを表示
      resultActions.style.display = 'flex';
      
      // トグルがオンの場合、自動的に選択肢を無効化
      if (autoDisableEnabled && currentResult) {
        const option = options.find(opt => opt.text === currentResult);
        if (option) {
          option.enabled = false;
          updateOptionsAndColors();
          renderOptions();
          if (!animationId) {
            drawRoulette(angle);
          }
        }
      }
      
      // 結果を履歴に追加
      addToHistory(result);
    }
    
    // 結果を履歴に追加する関数
    function addToHistory(result) {
      const now = new Date();
      const timeString = now.toLocaleTimeString();
      
      resultsHistory.unshift({
        result: result,
        time: timeString,
        timestamp: now.getTime()
      });
      
      // 履歴を最大20件まで保持
      if (resultsHistory.length > 20) {
        resultsHistory = resultsHistory.slice(0, 20);
      }
      
      renderResultsHistory();
    }
    
    // 結果履歴を表示する関数
    function renderResultsHistory() {
      resultsContainer.innerHTML = '';
      
      if (resultsHistory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.textContent = 'No results yet. Start the roulette to see results here.';
        emptyMessage.style.color = '#6b7280';
        emptyMessage.style.fontStyle = 'italic';
        resultsContainer.appendChild(emptyMessage);
        return;
      }
      
      resultsHistory.forEach((item, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        const resultText = document.createElement('div');
        resultText.textContent = item.result;
        
        const timeText = document.createElement('div');
        timeText.className = 'result-time';
        timeText.textContent = item.time;
        
        resultItem.appendChild(resultText);
        resultItem.appendChild(timeText);
        resultsContainer.appendChild(resultItem);
      });
    }
  
    // 選択肢と色を更新する関数
    function updateOptionsAndColors() {
      const enabledOptions = options.filter(option => option.enabled);
      colors = generateColors(enabledOptions.length);
    }
  
    // 選択肢リストを表示する関数
    function renderOptions() {
      optionsContainer.innerHTML = '';
      
      options.forEach((option, index) => {
        const optionItem = document.createElement('div');
        optionItem.className = `option-item ${option.enabled ? '' : 'disabled'}`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'option-checkbox';
        checkbox.checked = option.enabled;
        checkbox.addEventListener('change', (e) => {
          option.enabled = e.target.checked;
          updateOptionsAndColors();
          if (!animationId) {
            drawRoulette(angle);
          }
        });
        
        const text = document.createElement('span');
        text.className = 'option-text';
        text.textContent = option.text;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'option-delete';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', () => {
          options.splice(index, 1);
          renderOptions();
          updateOptionsAndColors();
          if (!animationId) {
            drawRoulette(angle);
          }
        });
        
        optionItem.appendChild(checkbox);
        optionItem.appendChild(text);
        optionItem.appendChild(deleteBtn);
        optionsContainer.appendChild(optionItem);
      });
    }
  
    // 新しい選択肢を追加する関数
    function addOption(text) {
      if (text.trim() && options.length < 100) {
        options.push({ text: text.trim(), enabled: true });
        renderOptions();
        updateOptionsAndColors();
        if (!animationId) {
          drawRoulette(angle);
        }
        newOptionInput.value = '';
      }
    }
  
    // イベントリスナーの設定
    addOptionBtn.addEventListener('click', () => {
      addOption(newOptionInput.value);
    });
  
    newOptionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addOption(newOptionInput.value);
      }
    });
  
    // 結果オプションの無効化処理
    disableResultOption.addEventListener('change', (e) => {
      autoDisableEnabled = e.target.checked;
      saveSettings(); // トグルの状態を保存
    });
  
    startBtn.addEventListener('click', () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      resultDiv.textContent = '';
      resultActions.style.display = 'none'; // 結果アクションを非表示
  
      const enabledOptions = options.filter(option => option.enabled);
      if (enabledOptions.length < 2) {
        alert('Please enable at least 2 options');
        return;
      }
      if (enabledOptions.length > 100) {
        alert('You can have up to 100 enabled options');
        return;
      }
      updateOptionsAndColors();
  
      angularVelocity = 0.3 + Math.random() * 0.3;
      startBtn.disabled = true;
      animate();
    });
  
    // キーボードイベントの追加
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        if (!startBtn.disabled) {
          startBtn.click();
        }
      }
    });
  
    // 設定の保存と読み込み
    function saveSettings() {
      localStorage.setItem('rouletteOptions', JSON.stringify(options));
      localStorage.setItem('rouletteHistory', JSON.stringify(resultsHistory));
      localStorage.setItem('autoDisableEnabled', JSON.stringify(autoDisableEnabled));
    }
  
    function loadSettings() {
      const savedOptions = localStorage.getItem('rouletteOptions');
      const savedHistory = localStorage.getItem('rouletteHistory');
      const savedAutoDisable = localStorage.getItem('autoDisableEnabled');
      
      if (savedOptions) {
        options = JSON.parse(savedOptions);
      }
      if (savedHistory) {
        resultsHistory = JSON.parse(savedHistory);
      }
      if (savedAutoDisable) {
        autoDisableEnabled = JSON.parse(savedAutoDisable);
        disableResultOption.checked = autoDisableEnabled;
      }
    }
  
    // 初期化
    updateOptionsAndColors();
    renderOptions();
    renderResultsHistory();
    drawRoulette(angle);
    loadSettings(); // 設定を読み込む
  })();