// ============================================
// Script Name : getCompOrder
// Version     : v6.0
// 仕様        : プロジェクト内全コンポを祖先深さ順（深い順）で出力
//               allCompOrderList に [[depth, CompItem], ...] を格納
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-05-30
// ============================================

allCompOrderList = [];
allCompOrderList = getCompOrder();

// **** FUNCTION ******************************************************************************************************************
//	コンポジションの階層順序取得
//	usedIn でネイティブに親コンポを取得し、メモ化再帰で祖先深さを計算
//	計算量: O(N)  ※旧 getParentComps 方式は O(N²×L)
		function getCompOrder()
{
		var i, comp;

		// 全コンポを収集
		var comps = [];
		for (i = 1; i <= app.project.numItems; i++) {
			if (app.project.item(i) instanceof CompItem) {
				comps.push(app.project.item(i));
			}
		}

		var depthCache = {};
		var visiting  = {};

		// 祖先深さ: 何段上位の親を持つか（トップレベル=0、1段ネスト=1、…）
		function ancestorDepth(comp) {
			var id = comp.id;
			if (depthCache[id] !== undefined) return depthCache[id];
			if (visiting[id]) { depthCache[id] = 0; return 0; }// 循環参照ガード
			visiting[id] = true;

			var parents = comp.usedIn;
			var maxD = 0;
			for (var p = 0; p < parents.length; p++) {
				var d = ancestorDepth(parents[p]) + 1;
				if (d > maxD) maxD = d;
			}

			visiting[id] = false;
			depthCache[id] = maxD;
			return maxD;
		}

		// 深さ付き配列を作成してソート（深い順）
		var result = [];
		for (i = 0; i < comps.length; i++) {
			result.push([ancestorDepth(comps[i]), comps[i]]);
		}
		result.sort(function(a, b) { return b[0] - a[0]; });
		return result;
}
