// ルーレットアプリケーションのメインクラス
class RouletteApp {
  constructor() {
    this.canvas = document.getElementById('roulette');
    this.ctx = this.canvas.getContext('2d');
    this.size = this.canvas.width;
    this.center = this.size / 2;
    
    // 状態管理
    this.state = {
      angle: 0,
      angularVelocity: 0,
      animationId: null,
      currentResult: null,
      autoDisableEnabled: false
    };
    
    // モジュールの初期化
    this.optionsManager = new OptionsManager();
    this.animationManager = new AnimationManager(this);
    this.renderer = new RouletteRenderer(this);
    this.historyManager = new HistoryManager();
    this.settingsManager = new SettingsManager();
    this.eventManager = new EventManager(this);
    
    // 初期化
    this.init();
  }
  
  init() {
    this.settingsManager.loadSettings(this);
    this.renderer.draw();
    this.eventManager.bindEvents();
  }
  
  // ルーレット開始
  start() {
    const enabledOptions = this.optionsManager.getEnabledOptions();
    
    if (enabledOptions.length < 2) {
      this.showError('Please enable at least 2 options');
      return;
    }
    
    if (enabledOptions.length > 100) {
      this.showError('You can have up to 100 enabled options');
      return;
    }
    
    this.state.angle = 0;
    this.state.angularVelocity = 0.3 + Math.random() * 0.3;
    this.animationManager.start();
  }
  
  // エラーメッセージ表示
  showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'flex';
    
    // 3秒後に自動的に非表示
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 3000);
  }
  
  // 結果表示
  showResult() {
    const result = this.calculateResult();
    if (!result) return;
    
    document.getElementById('result').textContent = `Result: ${result}!`;
    this.state.currentResult = result;
    
    // シンプルな光るアニメーションを実行
    this.renderer.showSimpleGlowAnimation(result, () => {
      // アニメーション終了後の処理
      if (this.state.autoDisableEnabled) {
        this.optionsManager.disableOption(result);
        this.renderer.draw();
        // チェックボックスの状態を更新
        this.eventManager.updateOptionsDisplay();
      }
    });
    
    // 履歴に追加
    this.historyManager.addResult(result, this.state.angle);
    this.settingsManager.saveSettings(this);
  }
  
  // 結果計算（シンプルな方法）
  calculateResult() {
    const enabledOptions = this.optionsManager.getEnabledOptions();
    if (enabledOptions.length === 0) {
      document.getElementById('result').textContent = 'No enabled options';
      return null;
    }
    
    const segments = enabledOptions.length;
    const arc = (2 * Math.PI) / segments;
    
    // 針が指している位置（12時方向）を基準に計算
    let normalizedAngle = this.state.angle % (2 * Math.PI);
    if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
    
    // 12時方向を0度として計算
    // ルーレットが時計回りに回転するので、角度を反転
    let needleAngle = -normalizedAngle;
    needleAngle = needleAngle % (2 * Math.PI);
    if (needleAngle < 0) needleAngle += 2 * Math.PI;
    
    // セグメントのインデックスを計算
    const index = Math.floor(needleAngle / arc) % segments;
    
    return enabledOptions[index].text;
  }
}

// 選択肢管理クラス
class OptionsManager {
  constructor() {
    this.options = [
      { text: 'Apple', enabled: true },
      { text: 'Banana', enabled: true },
      { text: 'Orange', enabled: true },
      { text: 'Melon', enabled: true },
      { text: 'Grape', enabled: true },
      { text: 'Peach', enabled: true }
    ];
    this.colors = [];
    this.updateColors();
  }
  
  getEnabledOptions() {
    return this.options.filter(option => option.enabled);
  }
  
  addOption(text) {
    if (text.trim() && this.options.length < 100) {
      this.options.push({ text: text.trim(), enabled: true });
      this.updateColors();
      return true;
    }
    return false;
  }
  
  removeOption(index) {
    this.options.splice(index, 1);
    this.updateColors();
  }
  
  toggleOption(index, enabled) {
    this.options[index].enabled = enabled;
    this.updateColors();
  }
  
  disableOption(text) {
    const option = this.options.find(opt => opt.text === text);
    if (option) {
      option.enabled = false;
      this.updateColors();
    }
  }
  
  updateColors() {
    const enabledCount = this.getEnabledOptions().length;
    this.colors = this.generateColors(enabledCount);
  }
  
  generateColors(count) {
    // モダンでポップな色パレット
    const modernColors = [
      '#FF6B6B', // コーラルレッド
      '#4ECDC4', // ターコイズ
      '#45B7D1', // スカイブルー
      '#96CEB4', // ミントグリーン
      '#FFEAA7', // ソフトイエロー
      '#DDA0DD', // プラム
      '#98D8C8', // セージグリーン
      '#F7DC6F', // ゴールデンイエロー
      '#BB8FCE', // ラベンダー
      '#85C1E9', // ライトブルー
      '#F8C471', // オレンジ
      '#82E0AA', // ライトグリーン
      '#F1948A', // ピンク
      '#85C1E9', // ブルー
      '#F7DC6F', // イエロー
      '#D7BDE2'  // ライトパープル
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(modernColors[i % modernColors.length]);
    }
    return colors;
  }
  
  getOptions() {
    return this.options;
  }
  
  setOptions(options) {
    this.options = options;
    this.updateColors();
  }
}

// アニメーション管理クラス
class AnimationManager {
  constructor(app) {
    this.app = app;
    this.friction = 0.98;
  }
  
  start() {
    if (this.app.state.animationId) {
      cancelAnimationFrame(this.app.state.animationId);
    }
    
    document.getElementById('result').textContent = '';
    document.getElementById('startBtn').disabled = true;
    this.animate();
  }
  
  animate() {
    if (this.app.state.angularVelocity > 0.002) {
      this.app.state.angle += this.app.state.angularVelocity;
      this.app.state.angularVelocity *= this.friction;
      this.app.renderer.draw();
      this.app.state.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.stop();
    }
  }
  
  stop() {
    cancelAnimationFrame(this.app.state.animationId);
    this.app.state.animationId = null;
    this.app.state.angularVelocity = 0;
    this.app.showResult();
    document.getElementById('startBtn').disabled = false;
  }
}

// ルーレット描画クラス
class RouletteRenderer {
  constructor(app) {
    this.app = app;
    this.canvas = app.canvas;
    this.ctx = app.ctx;
    this.size = app.size;
    this.center = app.center;
  }
  
  draw() {
    this.ctx.clearRect(0, 0, this.size, this.size);
    
    const enabledOptions = this.app.optionsManager.getEnabledOptions();
    const segments = enabledOptions.length;
    
    // 背景円
    this.drawBackground();
    
    // セグメント
    if (segments === 1) {
      this.drawSegment(0, 2 * Math.PI, this.app.optionsManager.colors[0], enabledOptions[0].text);
    } else if (segments > 1) {
      const arc = (2 * Math.PI) / segments;
      for (let i = 0; i < segments; i++) {
        // 12時方向（-π/2）から開始するように調整
        const startAngle = (i * arc - Math.PI / 2) + this.app.state.angle;
        const endAngle = startAngle + arc;
        this.drawSegment(startAngle, endAngle, this.app.optionsManager.colors[i], enabledOptions[i].text);
      }
    }
    
    // 中心円と矢印
    this.drawCenterCircle();
    this.drawArrow();
  }
  
  drawBackground() {
    // フラットな背景（境界線なし）
    this.ctx.beginPath();
    this.ctx.arc(this.center, this.center, this.center - 5, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fill();
  }
  
  drawSegment(startAngle, endAngle, color, text) {
    const radius = this.center - 15;
    
    // フラットなセグメント描画（グラデーションなし）
    this.ctx.beginPath();
    this.ctx.moveTo(this.center, this.center);
    this.ctx.arc(this.center, this.center, radius, startAngle, endAngle);
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
    
    // テキスト（影なし、フラットなスタイル）
    if (text) {
      this.ctx.save();
      this.ctx.translate(this.center, this.center);
      this.ctx.rotate(startAngle + (endAngle - startAngle) / 2);
      this.ctx.textAlign = "right";
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 16px sans-serif";
      
      this.ctx.fillText(text, radius - 30, 6);
      this.ctx.restore();
    }
  }
  
  drawCenterCircle() {
    // フラットな中心円（境界線なし）
    this.ctx.beginPath();
    this.ctx.arc(this.center, this.center, 15, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
  }
  
  drawArrow() {
    // フラットでモダンな針のデザイン（内側から指し示す）
    const arrowWidth = 6;
    const arrowHeight = 20;
    const arrowY = 15;
    
    // 針の本体（細長い三角形、内側から外側へ）
    this.ctx.beginPath();
    this.ctx.moveTo(this.center, arrowY + arrowHeight);
    this.ctx.lineTo(this.center - arrowWidth, arrowY);
    this.ctx.lineTo(this.center + arrowWidth, arrowY);
    this.ctx.closePath();
    this.ctx.fillStyle = '#374151';
    this.ctx.fill();
    
    // 針の先端（小さな円）
    this.ctx.beginPath();
    this.ctx.arc(this.center, arrowY - 3, 3, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#374151';
    this.ctx.fill();
  }
  
  parseColor(color) {
    // 16進数カラーコードを解析（HSLは使用しないため簡略化）
    return { h: 0, s: 0, l: 50 };
  }
  
  // シンプルな光るアニメーション
  showSimpleGlowAnimation(result, callback = null) {
    const animationDuration = 600; // 0.6秒
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // 現在のルーレットを描画
      this.draw();
      
      // シンプルな光るエフェクトを描画
      this.drawSimpleGlowEffect(result, progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // アニメーション終了
        this.draw(); // 最終描画
        if (callback) {
          setTimeout(callback, 100); // 0.1秒後にコールバック実行
        }
      }
    };
    
    animate();
  }
  
  // フラットな光るエフェクトを描画
  drawSimpleGlowEffect(result, progress) {
    const enabledOptions = this.app.optionsManager.getEnabledOptions();
    const segments = enabledOptions.length;
    
    if (segments === 0) return;
    
    // 結果に対応するセグメントのインデックスを取得
    const resultIndex = enabledOptions.findIndex(option => option.text === result);
    if (resultIndex === -1) return;
    
    const arc = (2 * Math.PI) / segments;
    const startAngle = (resultIndex * arc - Math.PI / 2) + this.app.state.angle;
    const endAngle = startAngle + arc;
    const radius = this.center - 15;
    
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen'; // 光る効果
    
    // フラットな光る効果（フェードイン→フェードアウト）
    const glowIntensity = Math.sin(progress * Math.PI) * 0.6;
    
    // フラットな光の色（白）
    this.ctx.fillStyle = `rgba(255, 255, 255, ${glowIntensity})`;
    
    // セグメント全体をフラットに光らせる
    this.ctx.beginPath();
    this.ctx.moveTo(this.center, this.center);
    this.ctx.arc(this.center, this.center, radius, startAngle, endAngle);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();
  }
}

// 履歴管理クラス
class HistoryManager {
  constructor() {
    this.history = [];
    this.maxHistory = 20;
  }
  
  addResult(result, angle) {
    const now = new Date();
    this.history.unshift({
      result: result,
      time: now.toLocaleTimeString(),
      timestamp: now.getTime(),
      angle: angle
    });
    
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }
    
    this.render();
  }
  
  clearHistory() {
    this.history = [];
    this.render();
  }
  
  render() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';
    
    if (this.history.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'No results yet. Start the roulette to see results here.';
      emptyMessage.style.color = '#6b7280';
      emptyMessage.style.fontStyle = 'italic';
      container.appendChild(emptyMessage);
      return;
    }
    
    this.history.forEach(item => {
      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';
      
      const resultText = document.createElement('div');
      resultText.textContent = item.result;
      
      const timeText = document.createElement('div');
      timeText.className = 'result-time';
      timeText.textContent = item.time;
      
      resultItem.appendChild(resultText);
      resultItem.appendChild(timeText);
      container.appendChild(resultItem);
    });
  }
  
  getHistory() {
    return this.history;
  }
  
  setHistory(history) {
    this.history = history;
    this.render();
  }
}

// 設定管理クラス
class SettingsManager {
  constructor() {
    this.storageKeys = {
      options: 'rouletteOptions',
      history: 'rouletteHistory',
      autoDisable: 'autoDisableEnabled'
    };
  }
  
  saveSettings(app) {
    localStorage.setItem(this.storageKeys.options, JSON.stringify(app.optionsManager.getOptions()));
    localStorage.setItem(this.storageKeys.history, JSON.stringify(app.historyManager.getHistory()));
    localStorage.setItem(this.storageKeys.autoDisable, JSON.stringify(app.state.autoDisableEnabled));
  }
  
  loadSettings(app) {
    const savedOptions = localStorage.getItem(this.storageKeys.options);
    const savedHistory = localStorage.getItem(this.storageKeys.history);
    const savedAutoDisable = localStorage.getItem(this.storageKeys.autoDisable);
    
    if (savedOptions) {
      app.optionsManager.setOptions(JSON.parse(savedOptions));
    }
    if (savedHistory) {
      app.historyManager.setHistory(JSON.parse(savedHistory));
    }
    if (savedAutoDisable) {
      app.state.autoDisableEnabled = JSON.parse(savedAutoDisable);
    }
    
    // チェックボックスの状態を確実に同期
    const autoDisableCheckbox = document.getElementById('disableResultOption');
    if (autoDisableCheckbox) {
      autoDisableCheckbox.checked = app.state.autoDisableEnabled;
    }
  }
}

// イベント管理クラス
class EventManager {
  constructor(app) {
    this.app = app;
  }
  
  bindEvents() {
    this.bindStartButton();
    this.bindOptionsEvents();
    this.bindHistoryEvents();
    this.bindKeyboardEvents();
  }
  
  bindStartButton() {
    document.getElementById('startBtn').addEventListener('click', () => {
      this.app.start();
    });
  }
  
  bindOptionsEvents() {
    // 選択肢追加
    const addOptionBtn = document.getElementById('addOptionBtn');
    const newOptionInput = document.getElementById('newOptionInput');
    
    addOptionBtn.addEventListener('click', () => {
      if (this.app.optionsManager.addOption(newOptionInput.value)) {
        this.updateOptionsDisplay();
        this.app.renderer.draw();
        newOptionInput.value = '';
        this.app.settingsManager.saveSettings(this.app);
      }
    });
    
    newOptionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addOptionBtn.click();
      }
    });
    
    // 自動無効化トグル
    document.getElementById('disableResultOption').addEventListener('change', (e) => {
      this.app.state.autoDisableEnabled = e.target.checked;
      this.app.settingsManager.saveSettings(this.app);
    });
    
    // 初期状態をチェックボックスに反映
    const autoDisableCheckbox = document.getElementById('disableResultOption');
    if (autoDisableCheckbox) {
      autoDisableCheckbox.checked = this.app.state.autoDisableEnabled;
    }
    
    this.updateOptionsDisplay();
  }
  
  bindHistoryEvents() {
    document.getElementById('resetHistoryBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all results history?')) {
        this.app.historyManager.clearHistory();
        this.app.settingsManager.saveSettings(this.app);
      }
    });
  }
  
  bindKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        const startBtn = document.getElementById('startBtn');
        if (!startBtn.disabled) {
          startBtn.click();
        }
      }
    });
  }
  
  updateOptionsDisplay() {
    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    
    this.app.optionsManager.getOptions().forEach((option, index) => {
      const optionItem = document.createElement('div');
      optionItem.className = option.enabled ? 'option-item' : 'option-item disabled';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'option-checkbox';
      checkbox.checked = option.enabled;
      checkbox.addEventListener('change', (e) => {
        this.app.optionsManager.toggleOption(index, e.target.checked);
        this.updateOptionsDisplay();
        this.app.renderer.draw();
        this.app.settingsManager.saveSettings(this.app);
      });
      
      const text = document.createElement('span');
      text.className = 'option-text';
      text.textContent = option.text;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'option-delete';
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', () => {
        this.app.optionsManager.removeOption(index);
        this.updateOptionsDisplay();
        this.app.renderer.draw();
        this.app.settingsManager.saveSettings(this.app);
      });
      
      optionItem.appendChild(checkbox);
      optionItem.appendChild(text);
      optionItem.appendChild(deleteBtn);
      container.appendChild(optionItem);
    });
  }
}

// アプリケーション初期化
(() => {
  new RouletteApp();
})();