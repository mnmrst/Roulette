/**
 * 共通ユーティリティクラス
 * アプリケーション全体で使用される共通機能を提供
 */

// 設定管理クラス
class SettingsManager {
  constructor() {
    this.storageKeys = {
      rouletteOptions: 'rouletteOptions',
      rouletteHistory: 'rouletteHistory',
      roleAssignmentRoles: 'roleAssignmentRoles',
      roleAssignmentUsernames: 'roleAssignmentUsernames',
      autoDisable: 'autoDisableEnabled'
    };
  }
  
  /**
   * アプリケーションの設定を保存
   * @param {Object} app - アプリケーションインスタンス
   */
  saveSettings(app) {
    try {
      if (app.historyManager && app.historyManager.getHistory) {
        const history = app.historyManager.getHistory();
        localStorage.setItem(this.storageKeys.rouletteHistory, JSON.stringify(history));
      }
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      ErrorManager.showError('設定の保存に失敗しました');
    }
  }
  
  /**
   * アプリケーションの設定を読み込み
   * @param {Object} app - アプリケーションインスタンス
   */
  loadSettings(app) {
    try {
      if (app.historyManager && app.historyManager.setHistory) {
        const savedHistory = localStorage.getItem(this.storageKeys.rouletteHistory);
        
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          if (Array.isArray(parsedHistory)) {
            app.historyManager.setHistory(parsedHistory);
          }
        }
      }
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
      ErrorManager.showError('設定の読み込みに失敗しました');
    }
  }
  
  /**
   * テキストエリアの値を保存
   * @param {string} key - 保存するキー
   * @param {string} value - 保存する値
   */
  saveTextareaValue(key, value) {
    try {
      if (this.storageKeys[key]) {
        localStorage.setItem(this.storageKeys[key], value);
      }
    } catch (error) {
      console.error('テキストエリアの保存に失敗しました:', error);
    }
  }
  
  /**
   * テキストエリアの値を読み込み
   * @param {string} key - 読み込むキー
   * @returns {string} 保存された値、または空文字列
   */
  loadTextareaValue(key) {
    try {
      if (this.storageKeys[key]) {
        return localStorage.getItem(this.storageKeys[key]) || '';
      }
    } catch (error) {
      console.error('テキストエリアの読み込みに失敗しました:', error);
    }
    return '';
  }
  
  /**
   * すべてのテキストエリアの値を読み込み
   */
  loadAllTextareaValues() {
    const savedValues = {};
    
    Object.keys(this.storageKeys).forEach(key => {
      if (key !== 'rouletteHistory' && key !== 'autoDisable') {
        const value = this.loadTextareaValue(key);
        if (value) {
          savedValues[key] = value;
        }
      }
    });
    
    return savedValues;
  }
  
  /**
   * 特定のキーの設定を削除
   * @param {string} key - 削除する設定のキー
   */
  clearSetting(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('設定の削除に失敗しました:', error);
    }
  }
  
  /**
   * すべての設定を削除
   */
  clearAllSettings() {
    try {
      Object.values(this.storageKeys).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('全設定の削除に失敗しました:', error);
    }
  }
}

// 履歴管理クラス
class HistoryManager {
  constructor(maxHistory = 20) {
    this.history = [];
    this.maxHistory = maxHistory;
  }
  
  /**
   * 結果を履歴に追加
   * @param {string} result - 結果テキスト
   * @param {number} angle - ルーレットの角度（オプション）
   */
  addResult(result, angle = null) {
    if (!result || typeof result !== 'string') {
      console.warn('無効な結果が渡されました:', result);
      return;
    }
    
    const now = new Date();
    const historyItem = {
      result: result.trim(),
      time: now.toLocaleTimeString(),
      timestamp: now.getTime(),
      angle: angle
    };
    
    this.history.unshift(historyItem);
    
    // 最大履歴数を超えた場合、古い履歴を削除
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }
    
    this.render();
  }
  
  /**
   * 履歴をクリア
   */
  clearHistory() {
    this.history = [];
    this.render();
  }
  
  /**
   * 履歴を取得
   * @returns {Array} 履歴配列
   */
  getHistory() {
    return [...this.history]; // 配列のコピーを返す
  }
  
  /**
   * 履歴を設定
   * @param {Array} history - 履歴配列
   */
  setHistory(history) {
    if (Array.isArray(history)) {
      this.history = history.slice(0, this.maxHistory); // 最大履歴数を超えないように制限
      this.render();
    } else {
      console.warn('無効な履歴データが渡されました:', history);
    }
  }
  
  /**
   * 履歴をDOMに表示
   */
  render() {
    const container = document.getElementById('resultsContainer');
    if (!container) {
      console.warn('結果コンテナが見つかりません');
      return;
    }
    
    container.innerHTML = '';
    
    if (this.history.length === 0) {
      this.renderEmptyState(container);
      return;
    }
    
    this.history.forEach(item => {
      this.renderHistoryItem(container, item);
    });
  }
  
  /**
   * 空の状態を表示
   * @param {HTMLElement} container - コンテナ要素
   */
  renderEmptyState(container) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'result-item empty-history';
    
    const emptyText = document.createElement('div');
    emptyText.className = 'result-text empty-text';
    emptyText.textContent = 'No results yet';
    
    const emptyTime = document.createElement('div');
    emptyTime.className = 'result-time';
    emptyTime.textContent = '';
    
    emptyMessage.appendChild(emptyText);
    emptyMessage.appendChild(emptyTime);
    container.appendChild(emptyMessage);
  }
  
  /**
   * 履歴アイテムを表示
   * @param {HTMLElement} container - コンテナ要素
   * @param {Object} item - 履歴アイテム
   */
  renderHistoryItem(container, item) {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    
    const resultText = document.createElement('div');
    resultText.className = 'result-text';
    resultText.textContent = item.result;
    
    const timeText = document.createElement('div');
    timeText.className = 'result-time';
    timeText.textContent = item.time;
    
    resultItem.appendChild(resultText);
    resultItem.appendChild(timeText);
    container.appendChild(resultItem);
  }
  
  /**
   * 履歴の統計情報を取得
   * @returns {Object} 統計情報
   */
  getStatistics() {
    const stats = {};
    this.history.forEach(item => {
      stats[item.result] = (stats[item.result] || 0) + 1;
    });
    return stats;
  }
}

// エラーメッセージ表示ユーティリティ
class ErrorManager {
  static errorQueue = [];
  static isShowing = false;
  
  /**
   * エラーメッセージを表示
   * @param {string} message - エラーメッセージ
   * @param {number} duration - 表示時間（ミリ秒）
   */
  static showError(message, duration = 3000) {
    if (!message || typeof message !== 'string') {
      console.warn('無効なエラーメッセージが渡されました:', message);
      return;
    }
    
    this.errorQueue.push({ message, duration });
    
    if (!this.isShowing) {
      this.processErrorQueue();
    }
  }
  
  /**
   * エラークエを処理
   */
  static processErrorQueue() {
    if (this.errorQueue.length === 0) {
      this.isShowing = false;
      return;
    }
    
    this.isShowing = true;
    const { message, duration } = this.errorQueue.shift();
    
    this.displayError(message, duration);
  }
  
  /**
   * エラーメッセージを実際に表示
   * @param {string} message - エラーメッセージ
   * @param {number} duration - 表示時間
   */
  static displayError(message, duration) {
    const errorElement = document.getElementById('errorMessage');
    if (!errorElement) {
      console.warn('エラーメッセージ要素が見つかりません');
      this.processErrorQueue();
      return;
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'flex';
    
    // 指定時間後に非表示
    setTimeout(() => {
      errorElement.style.display = 'none';
      this.processErrorQueue();
    }, duration);
  }
  
  /**
   * すべてのエラーメッセージをクリア
   */
  static clearErrors() {
    this.errorQueue = [];
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    this.isShowing = false;
  }
}

// DOM操作ユーティリティ
class DOMUtils {
  /**
   * 要素が存在するかチェック
   * @param {string} selector - セレクタ
   * @returns {boolean} 存在するかどうか
   */
  static elementExists(selector) {
    return document.querySelector(selector) !== null;
  }
  
  /**
   * 要素を安全に取得
   * @param {string} selector - セレクタ
   * @returns {HTMLElement|null} 要素またはnull
   */
  static getElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`要素が見つかりません: ${selector}`);
    }
    return element;
  }
  
  /**
   * 要素を安全に取得（必須）
   * @param {string} selector - セレクタ
   * @returns {HTMLElement} 要素
   * @throws {Error} 要素が見つからない場合
   */
  static getRequiredElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`必須要素が見つかりません: ${selector}`);
    }
    return element;
  }
  
  /**
   * イベントリスナーを安全に追加
   * @param {string} selector - セレクタ
   * @param {string} event - イベント名
   * @param {Function} handler - イベントハンドラー
   * @param {Object} options - オプション
   */
  static addEventListener(selector, event, handler, options = {}) {
    const element = this.getElement(selector);
    if (element) {
      element.addEventListener(event, handler, options);
    }
  }
  
  /**
   * クラスを安全に切り替え
   * @param {string} selector - セレクタ
   * @param {string} className - クラス名
   * @param {boolean} force - 強制追加/削除
   */
  static toggleClass(selector, className, force) {
    const element = this.getElement(selector);
    if (element) {
      element.classList.toggle(className, force);
    }
  }
}

// ユーティリティ関数
class Utils {
  /**
   * 数値を指定範囲内に制限
   * @param {number} value - 値
   * @param {number} min - 最小値
   * @param {number} max - 最大値
   * @returns {number} 制限された値
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  
  /**
   * 配列をシャッフル
   * @param {Array} array - シャッフルする配列
   * @returns {Array} シャッフルされた配列のコピー
   */
  static shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * 配列からランダムな要素を取得
   * @param {Array} array - 配列
   * @returns {*} ランダムな要素
   */
  static getRandomElement(array) {
    if (!Array.isArray(array) || array.length === 0) {
      return null;
    }
    return array[Math.floor(Math.random() * array.length)];
  }
  
  /**
   * 指定時間待機
   * @param {number} ms - 待機時間（ミリ秒）
   * @returns {Promise} Promise
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * デバウンス関数を作成
   * @param {Function} func - 実行する関数
   * @param {number} delay - 遅延時間（ミリ秒）
   * @returns {Function} デバウンスされた関数
   */
  static debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }
}
