/**
 * メインアプリケーションクラス
 * アプリケーション全体の初期化と管理を担当
 */
class MainApp {
  constructor() {
    this.apps = new Map();
    this.mainTabManager = null;
    this.isInitialized = false;
    
    // アプリケーションの設定
    this.config = {
      defaultTab: 'roulette',
      autoInit: true,
      debugMode: false
    };
  }
  
  /**
   * アプリケーションを初期化
   */
  async init() {
    try {
      if (this.isInitialized) {
        console.warn('アプリケーションは既に初期化されています');
        return;
      }
      
      console.log('アプリケーションを初期化中...');
      
      // メインタブマネージャーを初期化
      this.mainTabManager = new MainTabManager(this);
      this.mainTabManager.bindEvents();
      
      // 初期タブを決定
      const initialTab = this.getInitialTab();
      
      // 初期タブのアプリケーションを初期化
      await this.initApp(initialTab);
      
      this.isInitialized = true;
      console.log('アプリケーションの初期化が完了しました');
      
      // 初期化完了イベントを発火
      this.dispatchEvent('app:initialized', { tab: initialTab });
      
    } catch (error) {
      console.error('アプリケーションの初期化に失敗しました:', error);
      ErrorManager.showError('アプリケーションの初期化に失敗しました');
    }
  }
  
  /**
   * 初期タブを取得
   * @returns {string} 初期タブ名
   */
  getInitialTab() {
    const activeTab = document.querySelector('.main-tab-btn.active');
    if (activeTab) {
      return activeTab.getAttribute('data-main-tab');
    }
    return this.config.defaultTab;
  }
  
  /**
   * 指定されたタブのアプリケーションを初期化
   * @param {string} tabName - タブ名
   */
  async initApp(tabName) {
    try {
      if (this.apps.has(tabName)) {
        console.log(`${tabName}アプリは既に初期化されています`);
        return;
      }
      
      console.log(`${tabName}アプリを初期化中...`);
      
      let app = null;
      
      switch (tabName) {
        case 'roulette':
          app = new RouletteApp();
          break;
        case 'role-assignment':
          app = new RoleAssignmentManager();
          const eventManager = new RoleAssignmentEventManager(app);
          eventManager.bindEvents();
          break;
        default:
          throw new Error(`不明なタブ名: ${tabName}`);
      }
      
      this.apps.set(tabName, app);
      console.log(`${tabName}アプリの初期化が完了しました`);
      
    } catch (error) {
      console.error(`${tabName}アプリの初期化に失敗しました:`, error);
      ErrorManager.showError(`${tabName}アプリの初期化に失敗しました`);
    }
  }
  
  /**
   * タブ切り替え時の処理
   * @param {string} tabName - 切り替え先のタブ名
   */
  async onTabChange(tabName) {
    try {
      console.log(`タブを切り替え中: ${tabName}`);
      
      // アプリケーションが初期化されていない場合は初期化
      if (!this.apps.has(tabName)) {
        await this.initApp(tabName);
      }
      
      // タブ変更イベントを発火
      this.dispatchEvent('tab:changed', { tab: tabName });
      
    } catch (error) {
      console.error('タブ切り替えに失敗しました:', error);
      ErrorManager.showError('タブ切り替えに失敗しました');
    }
  }
  
  /**
   * アプリケーションインスタンスを取得
   * @param {string} tabName - タブ名
   * @returns {Object|null} アプリケーションインスタンス
   */
  getApp(tabName) {
    return this.apps.get(tabName) || null;
  }
  
  /**
   * すべてのアプリケーションを取得
   * @returns {Map} アプリケーションのマップ
   */
  getAllApps() {
    return new Map(this.apps);
  }
  
  /**
   * カスタムイベントを発火
   * @param {string} eventName - イベント名
   * @param {Object} detail - イベント詳細
   */
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: { ...detail, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * アプリケーションを破棄
   */
  destroy() {
    try {
      console.log('アプリケーションを破棄中...');
      
      // すべてのアプリケーションを破棄
      this.apps.forEach((app, tabName) => {
        if (app && typeof app.destroy === 'function') {
          app.destroy();
        }
      });
      
      this.apps.clear();
      this.isInitialized = false;
      
      console.log('アプリケーションの破棄が完了しました');
      
    } catch (error) {
      console.error('アプリケーションの破棄に失敗しました:', error);
    }
  }
}

/**
 * メインタブ管理クラス
 * タブの切り替えと状態管理を担当
 */
class MainTabManager {
  constructor(mainApp) {
    this.mainApp = mainApp;
    this.currentTab = null;
    this.tabButtons = [];
    this.tabPanels = [];
  }
  
  /**
   * イベントをバインド
   */
  bindEvents() {
    try {
      this.initializeElements();
      this.bindTabEvents();
      this.bindKeyboardEvents();
      
      console.log('メインタブのイベントバインドが完了しました');
      
    } catch (error) {
      console.error('メインタブのイベントバインドに失敗しました:', error);
      ErrorManager.showError('タブの初期化に失敗しました');
    }
  }
  
  /**
   * 要素を初期化
   */
  initializeElements() {
    this.tabButtons = Array.from(document.querySelectorAll('.main-tab-btn'));
    this.tabPanels = Array.from(document.querySelectorAll('.main-tab-panel'));
    
    if (this.tabButtons.length === 0) {
      throw new Error('タブボタンが見つかりません');
    }
    
    if (this.tabPanels.length === 0) {
      throw new Error('タブパネルが見つかりません');
    }
    
    // 初期タブを設定
    const activeButton = this.tabButtons.find(btn => btn.classList.contains('active'));
    if (activeButton) {
      this.currentTab = activeButton.getAttribute('data-main-tab');
    }
  }
  
  /**
   * タブイベントをバインド
   */
  bindTabEvents() {
    this.tabButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleTabClick(button);
      });
    });
  }
  
  /**
   * キーボードイベントをバインド
   */
  bindKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
      // Ctrl + 数字キーでタブ切り替え
      if (event.ctrlKey && event.key >= '1' && event.key <= '9') {
        const tabIndex = parseInt(event.key) - 1;
        if (tabIndex < this.tabButtons.length) {
          event.preventDefault();
          this.handleTabClick(this.tabButtons[tabIndex]);
        }
      }
    });
  }
  
  /**
   * タブクリックを処理
   * @param {HTMLElement} button - クリックされたボタン
   */
  async handleTabClick(button) {
    try {
      const targetTab = button.getAttribute('data-main-tab');
      
      if (!targetTab) {
        console.warn('タブ名が設定されていません');
        return;
      }
      
      if (targetTab === this.currentTab) {
        return; // 同じタブの場合は何もしない
      }
      
      // タブを切り替え
      await this.switchTab(targetTab);
      
    } catch (error) {
      console.error('タブクリックの処理に失敗しました:', error);
      ErrorManager.showError('タブの切り替えに失敗しました');
    }
  }
  
  /**
   * タブを切り替え
   * @param {string} targetTab - 切り替え先のタブ
   */
  async switchTab(targetTab) {
    try {
      // すべてのタブボタンからactiveクラスを削除
      this.tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // クリックされたボタンにactiveクラスを追加
      const targetButton = this.tabButtons.find(btn => 
        btn.getAttribute('data-main-tab') === targetTab
      );
      if (targetButton) {
        targetButton.classList.add('active');
      }
      
      // すべてのタブパネルを非表示
      this.tabPanels.forEach(panel => panel.classList.remove('active'));
      
      // 対象のタブパネルを表示
      const targetPanel = document.getElementById(`${targetTab}-main-tab`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
      
      // メインアプリに通知
      if (this.mainApp) {
        await this.mainApp.onTabChange(targetTab);
      }
      
      this.currentTab = targetTab;
      
      // タブ切り替え完了イベントを発火
      this.mainApp.dispatchEvent('tab:switched', { tab: targetTab });
      
    } catch (error) {
      console.error('タブ切り替えに失敗しました:', error);
      throw error;
    }
  }
  
  /**
   * 現在のタブを取得
   * @returns {string|null} 現在のタブ名
   */
  getCurrentTab() {
    return this.currentTab;
  }
  
  /**
   * 指定されたタブがアクティブかチェック
   * @param {string} tabName - タブ名
   * @returns {boolean} アクティブかどうか
   */
  isTabActive(tabName) {
    return this.currentTab === tabName;
  }
  
  /**
   * 利用可能なタブのリストを取得
   * @returns {Array} タブ名の配列
   */
  getAvailableTabs() {
    return this.tabButtons.map(btn => btn.getAttribute('data-main-tab')).filter(Boolean);
  }
}

/**
 * アプリケーション初期化
 * DOMContentLoadedイベントで初期化を開始
 */
(() => {
  let mainApp = null;
  
  const initializeApp = async () => {
    try {
      mainApp = new MainApp();
      await mainApp.init();
      
      // グローバルスコープに公開（デバッグ用）
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.mainApp = mainApp;
      }
      
    } catch (error) {
      console.error('アプリケーションの初期化に失敗しました:', error);
      ErrorManager.showError('アプリケーションの初期化に失敗しました');
    }
  };
  
  // DOMContentLoadedイベントで初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    // DOMContentLoadedが既に発火している場合
    initializeApp();
  }
  
  // ページアンロード時のクリーンアップ
  window.addEventListener('beforeunload', () => {
    if (mainApp) {
      mainApp.destroy();
    }
  });
})();
