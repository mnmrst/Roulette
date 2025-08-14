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
      isSpinning: false,
      lockedOptions: null, // 回転中に固定するオプション
      pendingOptionsChange: false // オプション変更の保留フラグ
    };
    
    // モジュールの初期化
    this.optionsManager = new OptionsManager();
    this.animationManager = new AnimationManager(this);
    this.renderer = new RouletteRenderer(this);
    this.historyManager = new HistoryManager();
    this.settingsManager = new SettingsManager();
    this.eventManager = new RouletteEventManager(this);
    
    // 初期化
    this.init();
  }
  
  init() {
    this.settingsManager.loadSettings(this);
    this.loadSavedOptions();
    this.optionsManager.updateColors();
    this.renderer.draw();
    this.eventManager.bindEvents();
    
    // 初期化時に結果要素をクリア
    const resultElement = document.getElementById('resultValue');
    if (resultElement) {
      resultElement.textContent = '';
    }
  }
  
  // 保存されたオプションを読み込み
  loadSavedOptions() {
    const savedOptions = this.settingsManager.loadTextareaValue('rouletteOptions');
    if (savedOptions) {
      const optionsTextarea = document.getElementById('rouletteOptions');
      if (optionsTextarea) {
        optionsTextarea.value = savedOptions;
      }
    }
  }
  
  // ルーレット開始
  start() {
    const enabledOptions = this.optionsManager.getEnabledOptions();
    
    if (enabledOptions.length < 2) {
      ErrorManager.showError('Please enable at least 2 options');
      return;
    }
    
    if (enabledOptions.length > 100) {
      ErrorManager.showError('You can have up to 100 enabled options');
      return;
    }
    
    // 回転開始時にオプションを固定
    this.state.lockedOptions = [...enabledOptions];
    this.state.isSpinning = true;
    this.state.pendingOptionsChange = false;
    this.state.angle = 0;
    this.state.angularVelocity = 0.09 + Math.random() * 0.09;
    this.animationManager.start();
  }
  
  // 結果表示
  showResult() {
    const result = this.calculateResult();
    const resultElement = document.getElementById('resultValue');
    if (!resultElement) return;
    
    if (!result) {
      resultElement.textContent = '';
      return;
    }
    
    resultElement.textContent = result;
    this.state.currentResult = result;
    
    // シンプルな光るアニメーションを実行
    this.renderer.showSimpleGlowAnimation(result, () => {
      // アニメーション完了後の処理
      this.onGlowAnimationComplete();
    });
    
    // 履歴に追加
    this.historyManager.addResult(result, this.state.angle);
    this.settingsManager.saveSettings(this);
  }
  
  // 光るアニメーション完了後の処理
  onGlowAnimationComplete() {
    // 回転終了時にオプションの固定を解除
    this.state.isSpinning = false;
    this.state.lockedOptions = null;
    
    // 保留中のオプション変更があれば反映
    if (this.state.pendingOptionsChange) {
      this.state.pendingOptionsChange = false;
      this.optionsManager.updateColors();
      this.renderer.draw();
    }
  }
  
  // 結果計算（シンプルな方法）
  calculateResult() {
    // 回転中は固定されたオプションを使用
    const enabledOptions = this.state.isSpinning && this.state.lockedOptions 
      ? this.state.lockedOptions 
      : this.optionsManager.getEnabledOptions();
      
    if (enabledOptions.length === 0) {
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
  
  // 回転中かどうかをチェック
  isSpinning() {
    return this.state.isSpinning;
  }
  
  // オプション変更を保留
  markOptionsChangePending() {
    if (this.state.isSpinning) {
      this.state.pendingOptionsChange = true;
    }
  }
}

// 選択肢管理クラス
class OptionsManager {
  constructor() {
    this.colors = [];
    this.updateColors();
  }
  
  getEnabledOptions() {
    const textarea = document.getElementById('rouletteOptions');
    if (!textarea) return [];
    
    const options = textarea.value
      .split('\n')
      .map(option => option.trim())
      .filter(option => option !== '');
    
    return options.map(text => ({ text }));
  }
  
  updateColors() {
    const enabledCount = this.getEnabledOptions().length;
    this.colors = this.generateColors(enabledCount);
  }
  
  // 回転中でない場合のみ色を更新
  updateColorsIfNotSpinning(app) {
    if (!app.isSpinning()) {
      this.updateColors();
    }
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
}

// アニメーション管理クラス
class AnimationManager {
  constructor(app) {
    this.app = app;
    this.friction = 0.992;
  }
  
  start() {
    if (this.app.state.animationId) {
      cancelAnimationFrame(this.app.state.animationId);
    }
    
    const resultElement = document.getElementById('resultValue');
    if (resultElement) {
      resultElement.textContent = '';
    }
    
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.disabled = true;
    }
    
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
    
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.disabled = false;
    }
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
    
    // 回転中は固定されたオプションを使用、そうでなければ現在のオプションを使用
    const enabledOptions = this.app.state.isSpinning && this.app.state.lockedOptions 
      ? this.app.state.lockedOptions 
      : this.app.optionsManager.getEnabledOptions();
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
    // 回転中は固定されたオプションを使用、そうでなければ現在のオプションを使用
    const enabledOptions = this.app.state.isSpinning && this.app.state.lockedOptions 
      ? this.app.state.lockedOptions 
      : this.app.optionsManager.getEnabledOptions();
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

// ルーレットイベント管理クラス
class RouletteEventManager {
  constructor(app) {
    this.app = app;
  }
  
  bindEvents() {
    this.bindStartButton();
    this.bindOptionsEvents();
    this.bindHistoryEvents();
    this.bindKeyboardEvents();
    this.bindTabEvents();
  }
  
  bindStartButton() {
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.app.start();
      });
    }
  }
  
  bindOptionsEvents() {
    // テキストエリアの変更を監視
    const rouletteOptions = document.getElementById('rouletteOptions');
    if (rouletteOptions) {
      // デバウンス処理で自動保存
      const debouncedSave = Utils.debounce((value) => {
        this.app.settingsManager.saveTextareaValue('rouletteOptions', value);
      }, 500);
      
      rouletteOptions.addEventListener('input', (event) => {
        const value = event.target.value;
        
        // 回転中でない場合のみオプションを更新
        if (!this.app.isSpinning()) {
          this.app.optionsManager.updateColors();
          this.app.renderer.draw();
        } else {
          // 回転中の場合は変更を保留
          this.app.markOptionsChangePending();
        }
        
        // 自動保存
        debouncedSave(value);
      });
    }
  }
  
  bindHistoryEvents() {
    const resetHistoryBtn = document.getElementById('resetHistoryBtn');
    if (resetHistoryBtn) {
      resetHistoryBtn.addEventListener('click', () => {
        this.app.historyManager.clearHistory();
        this.app.settingsManager.saveSettings(this.app);
      });
    }
  }
  
  bindKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        const startBtn = document.getElementById('startBtn');
        if (startBtn && !startBtn.disabled) {
          startBtn.click();
        }
      }
    });
  }
  
  bindTabEvents() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // すべてのタブボタンからactiveクラスを削除
        tabButtons.forEach(btn => btn.classList.remove('active'));
        // クリックされたボタンにactiveクラスを追加
        button.classList.add('active');
        
        // すべてのタブパネルを非表示
        tabPanels.forEach(panel => panel.classList.remove('active'));
        // 対象のタブパネルを表示
        const targetPanel = document.getElementById(`${targetTab}-tab`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }
  

}
