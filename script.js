document.addEventListener('DOMContentLoaded', () => {
    const caseListContainer = document.getElementById('caseList');
    const categoryFiltersContainer = document.getElementById('categoryFilters');
    const keywordSearchInput = document.getElementById('keywordSearch');

    let allCases = []; // 全ての事例データを保持する配列
    let uniqueCategories = new Set(); // カテゴリを重複なく保持するSet

    // 1. JSONデータを読み込む関数 (変更なし)
    async function loadCases() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allCases = await response.json();
            // console.log('事例データを読み込みました:', allCases);
            extractCategories();
            renderCategories();
            renderCases(allCases); // 初期表示
        } catch (error) {
            console.error('事例データの読み込みに失敗しました:', error);
            caseListContainer.innerHTML = '<p>事例データの読み込みに失敗しました。管理者にご連絡ください。</p>';
        }
    }

    // 2. 事例データからカテゴリを抽出する関数 (変更なし)
    function extractCategories() {
        allCases.forEach(item => {
            if (item.category && Array.isArray(item.category)) {
                item.category.forEach(cat => uniqueCategories.add(cat));
            }
        });
        // console.log('抽出されたカテゴリ:', uniqueCategories);
    }

    // 3. カテゴリフィルターをレンダリングする関数 (変更なし)
    function renderCategories() {
        categoryFiltersContainer.innerHTML = ''; // コンテナをクリア
        uniqueCategories.forEach(category => {
            const div = document.createElement('div');
            div.classList.add('filter-option');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `cat-${category}`;
            checkbox.value = category;
            checkbox.addEventListener('change', filterAndSearchCases); // ★変更時に絞り込み実行

            const label = document.createElement('label');
            label.htmlFor = `cat-${category}`;
            label.textContent = category;

            div.appendChild(checkbox);
            div.appendChild(label);
            categoryFiltersContainer.appendChild(div);
        });
    }

    // 4. 事例一覧をレンダリングする関数 (変更なし)
    function renderCases(casesToRender) {
        caseListContainer.innerHTML = ''; 

        if (casesToRender.length === 0) {
            caseListContainer.innerHTML = '<p>該当する事例はありません。</p>';
            return;
        }

        casesToRender.forEach(item => {
            const caseElement = document.createElement('div');
            caseElement.classList.add('case-item');

            let thumbnailHtml = '';
            if (item.thumbnail_image) {
                thumbnailHtml = `<img src="${item.thumbnail_image}" alt="${item.summary}" class="thumbnail">`;
            } else if (item.before_image) { 
                thumbnailHtml = `<img src="${item.before_image}" alt="${item.summary}" class="thumbnail">`;
            }

            let categoriesHtml = '';
            if (item.category && item.category.length > 0) {
                categoriesHtml = item.category.map(cat => `<span class="category-tag">${cat}</span>`).join(' ');
            }

            caseElement.innerHTML = `
                ${thumbnailHtml}
                <div class="case-item-content">
                    <h3>${item.summary}</h3>
                    <p><strong>指摘日:</strong> ${item.date_reported || '未設定'}</p>
                    <p><strong>場所:</strong> ${item.location || '未設定'}</p>
                    <div class="categories">${categoriesHtml}</div>
                    <a href="detail.html?id=${item.id}" class="detail-button">詳細を見る</a>
                </div>
            `;
            caseListContainer.appendChild(caseElement);
        });
    }

    // 5. ★★★ フィルタリングと検索を実行するメインの関数 (ここを大幅に更新) ★★★
    function filterAndSearchCases() {
        // 5.1. キーワード取得 (全角スペースを半角に、小文字に統一)
        const keyword = keywordSearchInput.value.trim().toLowerCase().replace(/　/g, ' ');
        const keywords = keyword.split(' ').filter(k => k !== ''); // スペースで区切って配列に

        // 5.2. 選択されたカテゴリを取得
        const selectedCategories = [];
        const categoryCheckboxes = categoryFiltersContainer.querySelectorAll('input[type="checkbox"]:checked');
        categoryCheckboxes.forEach(checkbox => {
            selectedCategories.push(checkbox.value);
        });

        // 5.3. フィルタリング実行
        let filteredCases = allCases.filter(item => {
            // カテゴリでの絞り込み
            const categoryMatch = selectedCategories.length === 0 || 
                                  selectedCategories.every(selCat => item.category && item.category.includes(selCat));
            if (!categoryMatch) {
                return false;
            }

            // キーワードでの絞り込み (keywords配列の全ての単語を含むか)
            if (keywords.length > 0) {
                const searchableText = [
                    item.id,
                    item.date_reported,
                    item.date_improved,
                    item.location,
                    item.improver,
                    item.summary,
                    item.problem_details,
                    item.improvement_details,
                    ...(item.category || []) // カテゴリも配列なので展開して結合
                ].join(' ').toLowerCase(); // 全項目を連結して小文字に

                const keywordMatch = keywords.every(kw => searchableText.includes(kw));
                if (!keywordMatch) {
                    return false;
                }
            }
            return true; // 全ての条件を満たせばtrue
        });

        renderCases(filteredCases);
    }
    
    // キーワード検索入力時のイベントリスナー (変更なし)
    if (keywordSearchInput) {
        // 'input' イベントは入力があるたびに発生する
        keywordSearchInput.addEventListener('input', filterAndSearchCases);
    }

    // 初期化処理 (変更なし)
    loadCases();
});