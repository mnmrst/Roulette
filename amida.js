/**
 * ロール割り当て管理クラス
 * ロールとユーザー名のランダム割り当てを管理
 */
class RoleAssignmentManager {
  constructor() {
    this.roles = [];
    this.usernames = [];
    this.assignments = [];
    this.isAnimating = false;
    this.isProcessing = false;
    this.settingsManager = new SettingsManager();
    
    // 設定
    this.config = {
      maxRoles: 50,
      maxUsernames: 50,
      animationDelay: 800,
      highlightDelay: 200
    };
    
    // 初期化時に保存された値を読み込み
    this.loadSavedValues();
  }
  
  // 保存された値を読み込み
  loadSavedValues() {
    const savedRoles = this.settingsManager.loadTextareaValue('roleAssignmentRoles');
    const savedUsernames = this.settingsManager.loadTextareaValue('roleAssignmentUsernames');
    
    if (savedRoles) {
      const rolesTextarea = document.getElementById('roleAssignmentRoles');
      if (rolesTextarea) {
        rolesTextarea.value = savedRoles;
      }
    }
    
    if (savedUsernames) {
      const usernamesTextarea = document.getElementById('roleAssignmentUsernames');
      if (usernamesTextarea) {
        usernamesTextarea.value = savedUsernames;
      }
    }
  }
  
  /**
   * 入力値を取得して検証
   * @returns {boolean} 入力が有効かどうか
   */
  getInputs() {
    try {
      const rolesText = DOMUtils.getElement('#roleAssignmentRoles')?.value || '';
      const usernamesText = DOMUtils.getElement('#roleAssignmentUsernames')?.value || '';
      
      this.roles = this.parseInput(rolesText);
      this.usernames = this.parseInput(usernamesText);
      
      return this.validateInputs();
      
    } catch (error) {
      console.error('入力値の取得に失敗しました:', error);
      return false;
    }
  }
  
  /**
   * 入力テキストを解析
   * @param {string} text - 入力テキスト
   * @returns {Array} 解析された配列
   */
  parseInput(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    return text
      .split('\n')
      .map(item => item.trim())
      .filter(item => item !== '');
  }
  
  /**
   * 入力値を検証
   * @returns {boolean} 検証結果
   */
  validateInputs() {
    // 基本的な検証
    if (this.roles.length === 0) {
      ErrorManager.showError('ロールを入力してください');
      return false;
    }
    
    if (this.usernames.length === 0) {
      ErrorManager.showError('ユーザー名を入力してください');
      return false;
    }
    
    // 最大数チェック
    if (this.roles.length > this.config.maxRoles) {
      ErrorManager.showError(`ロールは最大${this.config.maxRoles}個まで入力できます`);
      return false;
    }
    
    if (this.usernames.length > this.config.maxUsernames) {
      ErrorManager.showError(`ユーザー名は最大${this.config.maxUsernames}個まで入力できます`);
      return false;
    }
    
    // 重複チェック
    const uniqueRoles = new Set(this.roles);
    if (uniqueRoles.size !== this.roles.length) {
      ErrorManager.showError('ロールに重複があります');
      return false;
    }
    
    const uniqueUsernames = new Set(this.usernames);
    if (uniqueUsernames.size !== this.usernames.length) {
      ErrorManager.showError('ユーザー名に重複があります');
      return false;
    }
    
    return true;
  }
  
  /**
   * ランダム割り当てを実行
   * @returns {boolean} 割り当てが成功したかどうか
   */
  assignRoles() {
    try {
      if (this.roles.length === 0 || this.usernames.length === 0) {
        console.warn('ロールまたはユーザー名が不足しています');
        return false;
      }
      
      // ユーザー名をシャッフル
      const shuffledUsernames = Utils.shuffle(this.usernames);
      
      // ロールの順序を保持してユーザー名を割り当て
      this.assignments = this.roles.map((role, index) => {
        return {
          role: role,
          username: shuffledUsernames[index % shuffledUsernames.length],
          index: index
        };
      });
      
      console.log('ロール割り当てが完了しました:', this.assignments);
      return true;
      
    } catch (error) {
      console.error('ロール割り当てに失敗しました:', error);
      ErrorManager.showError('ロール割り当てに失敗しました');
      return false;
    }
  }
  
  /**
   * 結果を表示
   */
  displayResults() {
    try {
      const resultList = DOMUtils.getElement('#roleAssignmentResultList');
      if (!resultList) {
        console.warn('結果リスト要素が見つかりません');
        return;
      }
      
      resultList.innerHTML = '';
      
      this.assignments.forEach((assignment, index) => {
        const resultItem = this.createResultItem(assignment, index);
        resultList.appendChild(resultItem);
      });
      
    } catch (error) {
      console.error('結果の表示に失敗しました:', error);
      ErrorManager.showError('結果の表示に失敗しました');
    }
  }
  
  /**
   * 結果アイテムを作成
   * @param {Object} assignment - 割り当て情報
   * @param {number} index - インデックス
   * @returns {HTMLElement} 結果アイテム要素
   */
  createResultItem(assignment, index) {
    const resultItem = document.createElement('div');
    resultItem.className = 'role-assignment-result-item';
    resultItem.style.opacity = '0';
    resultItem.dataset.index = index;
    
    resultItem.innerHTML = `
      <span class="role-assignment-result-role">${this.escapeHtml(assignment.role)}</span>
      <span class="role-assignment-result-username">${this.escapeHtml(assignment.username)}</span>
    `;
    
    return resultItem;
  }
  
  /**
   * HTMLエスケープ
   * @param {string} text - エスケープするテキスト
   * @returns {string} エスケープされたテキスト
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * 順次アニメーション表示
   */
  async animateResults() {
    if (this.isAnimating) {
      console.warn('アニメーションが既に実行中です');
      return;
    }
    
    try {
      this.isAnimating = true;
      const resultItems = document.querySelectorAll('.role-assignment-result-item');
      
      for (let i = 0; i < resultItems.length; i++) {
        const item = resultItems[i];
        
        // フェードインアニメーション
        item.style.opacity = '1';
        item.classList.add('animated');
        
        // ハイライト効果
        item.classList.add('highlight');
        
        // 次のアイテムまで待機
        await Utils.sleep(this.config.animationDelay);
        
        // ハイライトを削除
        item.classList.remove('highlight');
        
        // 最後のアイテムでない場合は少し待機
        if (i < resultItems.length - 1) {
          await Utils.sleep(this.config.highlightDelay);
        }
      }
      
    } catch (error) {
      console.error('アニメーションに失敗しました:', error);
    } finally {
      this.isAnimating = false;
    }
  }
  
  /**
   * 結果をクリア
   */
  clearResults() {
    try {
      const resultList = DOMUtils.getElement('#roleAssignmentResultList');
      if (resultList) {
        resultList.innerHTML = '';
      }
      this.assignments = [];
      
    } catch (error) {
      console.error('結果のクリアに失敗しました:', error);
    }
  }
  
  /**
   * 割り当て結果を取得
   * @returns {Array} 割り当て結果の配列
   */
  getAssignments() {
    return [...this.assignments];
  }
  
  /**
   * 統計情報を取得
   * @returns {Object} 統計情報
   */
  getStatistics() {
    const stats = {
      totalRoles: this.roles.length,
      totalUsernames: this.usernames.length,
      assignments: this.assignments.length,
      roleDistribution: {},
      usernameDistribution: {}
    };
    
    // ロールの分布
    this.assignments.forEach(assignment => {
      stats.roleDistribution[assignment.role] = (stats.roleDistribution[assignment.role] || 0) + 1;
    });
    
    // ユーザー名の分布
    this.assignments.forEach(assignment => {
      stats.usernameDistribution[assignment.username] = (stats.usernameDistribution[assignment.username] || 0) + 1;
    });
    
    return stats;
  }
  
  /**
   * アプリケーションを破棄
   */
  destroy() {
    this.clearResults();
    this.roles = [];
    this.usernames = [];
    this.assignments = [];
    this.isAnimating = false;
    this.isProcessing = false;
  }
}

/**
 * ロール割り当てイベント管理クラス
 * UIイベントとユーザーインタラクションを管理
 */
class RoleAssignmentEventManager {
  constructor(roleAssignmentManager) {
    this.roleAssignmentManager = roleAssignmentManager;
    this.isInitialized = false;
  }
  
  /**
   * イベントをバインド
   */
  bindEvents() {
    try {
      this.bindStartButton();
      this.bindInputValidation();
      this.bindKeyboardEvents();
      
      this.isInitialized = true;
      console.log('ロール割り当てイベントのバインドが完了しました');
      
    } catch (error) {
      console.error('ロール割り当てイベントのバインドに失敗しました:', error);
      ErrorManager.showError('イベントの初期化に失敗しました');
    }
  }
  
  /**
   * 開始ボタンのイベントをバインド
   */
  bindStartButton() {
    DOMUtils.addEventListener('#startRoleAssignmentBtn', 'click', async (event) => {
      event.preventDefault();
      await this.handleStart();
    });
  }
  
  /**
   * 入力検証のイベントをバインド
   */
  bindInputValidation() {
    const debouncedValidation = Utils.debounce(() => {
      this.updateButtonState();
    }, 300);
    
    // ロール入力の監視
    const rolesTextarea = document.getElementById('roleAssignmentRoles');
    if (rolesTextarea) {
      const debouncedSaveRoles = Utils.debounce((value) => {
        this.roleAssignmentManager.settingsManager.saveTextareaValue('roleAssignmentRoles', value);
      }, 500);
      
      rolesTextarea.addEventListener('input', (event) => {
        const value = event.target.value;
        debouncedValidation();
        debouncedSaveRoles(value);
      });
    }
    
    // ユーザー名入力の監視
    const usernamesTextarea = document.getElementById('roleAssignmentUsernames');
    if (usernamesTextarea) {
      const debouncedSaveUsernames = Utils.debounce((value) => {
        this.roleAssignmentManager.settingsManager.saveTextareaValue('roleAssignmentUsernames', value);
      }, 500);
      
      usernamesTextarea.addEventListener('input', (event) => {
        const value = event.target.value;
        debouncedValidation();
        debouncedSaveUsernames(value);
      });
    }
    
    // 初期状態を設定
    this.updateButtonState();
  }
  
  /**
   * キーボードイベントをバインド
   */
  bindKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
      // Ctrl + Enter で開始
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        const startBtn = DOMUtils.getElement('#startRoleAssignmentBtn');
        if (startBtn && !startBtn.disabled) {
          this.handleStart();
        }
      }
    });
  }
  
  /**
   * ボタンの状態を更新
   */
  updateButtonState() {
    try {
      const startBtn = DOMUtils.getElement('#startRoleAssignmentBtn');
      if (!startBtn) return;
      
      const rolesTextarea = DOMUtils.getElement('#roleAssignmentRoles');
      const usernamesTextarea = DOMUtils.getElement('#roleAssignmentUsernames');
      
      if (!rolesTextarea || !usernamesTextarea) return;
      
      const roles = this.roleAssignmentManager.parseInput(rolesTextarea.value);
      const usernames = this.roleAssignmentManager.parseInput(usernamesTextarea.value);
      
      const isValid = roles.length > 0 && usernames.length > 0;
      
      startBtn.disabled = !isValid || this.roleAssignmentManager.isProcessing;
      
      if (!isValid) {
        startBtn.textContent = 'ロールとユーザー名を入力してください';
      } else if (this.roleAssignmentManager.isProcessing) {
        startBtn.textContent = '処理中...';
      } else {
        startBtn.textContent = '開始';
      }
      
    } catch (error) {
      console.error('ボタン状態の更新に失敗しました:', error);
    }
  }
  
  /**
   * 開始処理を実行
   */
  async handleStart() {
    try {
      if (this.roleAssignmentManager.isProcessing) {
        console.warn('処理が既に実行中です');
        return;
      }
      
      const startBtn = DOMUtils.getElement('#startRoleAssignmentBtn');
      if (!startBtn) return;
      
      // 入力値を取得
      if (!this.roleAssignmentManager.getInputs()) {
        return; // エラーメッセージはgetInputs内で表示される
      }
      
      // ボタンを無効化
      this.roleAssignmentManager.isProcessing = true;
      this.updateButtonState();
      
      // 結果をクリア
      this.roleAssignmentManager.clearResults();
      
      // ランダム割り当てを実行
      if (!this.roleAssignmentManager.assignRoles()) {
        return; // エラーメッセージはassignRoles内で表示される
      }
      
      // 結果を表示
      this.roleAssignmentManager.displayResults();
      
      // アニメーション開始前に少し待機
      await Utils.sleep(300);
      
      // 順次アニメーション表示
      await this.roleAssignmentManager.animateResults();
      
      // 完了イベントを発火
      this.dispatchEvent('role-assignment:completed', {
        assignments: this.roleAssignmentManager.getAssignments(),
        statistics: this.roleAssignmentManager.getStatistics()
      });
      
    } catch (error) {
      console.error('開始処理に失敗しました:', error);
      ErrorManager.showError('処理に失敗しました: ' + error.message);
    } finally {
      // ボタンを再有効化
      this.roleAssignmentManager.isProcessing = false;
      this.updateButtonState();
    }
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
}
