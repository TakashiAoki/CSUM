// buildLayerGroupComp Ver1.5
// Copyright (c) 2007-2023 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2026/09/12
// 選択レイヤーをプリコンポーズして、プリコンポサイズを選択レイヤーサイズにリサイズ、プリコンポを元の位置にオフセットします
// Ver1.2 : 回転・スケールを掛けたレイヤーの外接矩形を正しく算出するよう修正（縦組みテキスト等）
// Ver1.3 : プリコンポ名をダイアログで指定可能に（既定値＝選択中の最下層レイヤー名）、マージン既定値を 0px に変更、Cancel 時の中断処理を追加
// Ver1.4 : 親子付きレイヤーの外接矩形を正しく算出（親チェーンを遡る）。ガイドレイヤーと実体0x0のレイヤーを算出から除外
// Ver1.5 : ランチャー経由でも例外が見えるよう ERROR GUARD を追加

var curScriptName = "buildLayerGroupComp";

// **** ERROR GUARD ***************************************************************************************************************
//		ランチャー（CL_Extra / KBar 等）のボタンから起動すると、ScriptUIのイベントハンドラ内で起きた
//		例外を After Effects は報告しない＝失敗しても「黙って終わった」ようにしか見えない
//		（実測と経緯 = docs/INCIDENTS.md 2026-09-03／型の見本 = EditCompSettings.jsx v5.4）。
//		実行ブロック全体をここで囲み、例外は必ず自前で alert に出す。
try {

var defMarginValue = 0;
var boundsFailed = false;

// **** Main Script *****************************************************************************************************************
app.beginUndoGroup( curScriptName );

	if ( app.project.activeItem != null )
	{
		getSelectLayerList();
		if ( selectLayerList.length > 0 )
		{
			getDefaultPreCompName();
			getBuildOptions();
			if ( magineSize != null )// Cancel 時は何もしない
			{
				getLayerBounds();
				if ( !boundsFailed ) { buildLayerGroupComp(); }
			}
		}
		else
		{ alert("レイヤーを1つ以上選択して下さい。"); }
	}

app.endUndoGroup();

} catch ( err ) { reportScriptError( err ); }
// **** ERROR GUARD END ***********************************************************************************************************
// **** FUNCTION ******************************************************************************************************************
//		選択レイヤーリスト取得
		function getSelectLayerList()
{
		activeComp = null;
		activeCompName = null;
		activeCompWidth = null;
		activeCompHeight = null;
		activeCompDuration = null;
		activeCompFrameRate = null;
		activeCompStartTime = null;
		appDisplayStartFrame = null;
		selectLayerList = new Array();

		var activeItem = app.project.activeItem;
		if ( activeItem instanceof CompItem )
		{
			activeComp = activeItem;
			activeCompName = activeComp.name;
			activeCompWidth = activeComp.width;
			activeCompHeight = activeComp.height;
			activeCompDuration = activeComp.duration;
			activeCompFrameRate = activeComp.frameRate;
			activeCompStartTime = activeComp.displayStartTime;//コンポジション設定の開始フレーム
			appDisplayStartFrame = app.project.displayStartFrame;//プロジェクト設定の開始フレーム
			selectLayerList = activeComp.selectedLayers;//レイヤーリスト
		};
}
// **** FUNCTION ******************************************************************************************************************
//		既定プリコンポ名（選択中の最下層レイヤー名）を取得
		function getDefaultPreCompName()
{
		defPreCompName = "";
		var bottomIndex = -1;// index は大きいほど下層

		for (var i = 0; i < selectLayerList.length; i++)
		{
			if (selectLayerList[i].index > bottomIndex)
			{
				bottomIndex = selectLayerList[i].index;
				defPreCompName = selectLayerList[i].name;
			}
		}
}
// **** FUNCTION ******************************************************************************************************************
//		プリコンポ名・マージンサイズ入力ダイアログ
		function getBuildOptions()
{
		preCompName = null;
		magineSize = null;

		var labelWidth = 96;

		// ダイアログの作成
		var dialog = new Window("dialog", "Input value");
		dialog.orientation = "column";
		dialog.alignChildren = "left";

		var nameGroup = dialog.add("group");
		nameGroup.orientation = "row";
		var nameLabel = nameGroup.add("statictext", undefined, "preComp name :");
		nameLabel.preferredSize.width = labelWidth;
		var inputName = nameGroup.add("edittext", undefined, defPreCompName);
		inputName.characters = 24;
		inputName.active = true;

		var sizeGroup = dialog.add("group");
		sizeGroup.orientation = "row";
		var sizeLabel = sizeGroup.add("statictext", undefined, "Magine size :");
		sizeLabel.preferredSize.width = labelWidth;
		var inputValue = sizeGroup.add("edittext", undefined, defMarginValue);
		inputValue.characters = 10;
		sizeGroup.add("statictext", undefined, "px");

		var buttonsGroup = dialog.add("group");
		buttonsGroup.orientation = "row";
		buttonsGroup.alignment = "right";
		var cancelButton = buttonsGroup.add("button", undefined, "Cancel");
		var okButton = buttonsGroup.add("button", undefined, "OK");

		// OK ボタンの処理
		okButton.onClick = function() {
			var value = parseFloat(inputValue.text);
			var name = inputName.text.replace(/^\s+|\s+$/g, "");
			if (isNaN(value)) { alert("Invalid margin size. Please input again."); return; }
			if (name == "") { alert("Please input preComp name."); return; }
			magineSize = value;
			preCompName = name;
			dialog.close();
		};

		// キャンセル ボタンの処理
		cancelButton.onClick = function() {
			dialog.close();
		};

		// ダイアログを表示
		dialog.show();
}
// **** FUNCTION ******************************************************************************************************************
//		選択されたすべてのレイヤーの左上と右下の座標を算出
//		1点を「そのレイヤーの座標系」から「1つ上の座標系」へ変換する
//		（レイヤー自身に使えばソース座標→親空間、親に使えば親空間→その上の空間）
		function applyLayerTransform( pt, layer )
{
		var anc = layer.transform.anchorPoint.value;
		var sc  = layer.transform.scale.value;
		var pos = layer.transform.position.value;

		var rot = 0;
		// 3Dレイヤーには transform.rotation が無いので matchName で取る
		try { rot = layer.property("ADBE Transform Group").property("ADBE Rotate Z").value; } catch (e) { rot = 0; }

		var rad = rot * Math.PI / 180;
		var cosR = Math.cos(rad);
		var sinR = Math.sin(rad);

		var lx = (pt[0] - anc[0]) * sc[0] / 100;
		var ly = (pt[1] - anc[1]) * sc[1] / 100;

		return [ lx * cosR - ly * sinR + pos[0], lx * sinR + ly * cosR + pos[1] ];
}
// **** FUNCTION ******************************************************************************************************************
		function getLayerBounds()
{
		var minX = Infinity;
		var minY = Infinity;
		var maxX = -Infinity;
		var maxY = -Infinity;

		for (var i = 0; i < selectLayerList.length; i++)
		{
			var layer = selectLayerList[i];
			
			//選択レイヤーの親レイヤーが選択レイヤーに含まれていない場合、親子設定をOFFに
			var parent = layer.parent;
			if (parent != null && selectLayerList.indexOf(parent) == -1) {layer.parent = null;}

			var layerBounds = layer.sourceRectAtTime(0, false);

			// 🛑 ガイドレイヤーは出力に出ないが sourceRect と位置は持っている。
			//    そのまま数えるとプリコンポサイズが実際の絵より大きくなる。
			//    Overlord v2 は空グループをガイドレイヤーとして大量に残すことがある（実害 2026-09-05・B3 の 105_Surveillance）
			var isGuide = false;
			try { isGuide = layer.guideLayer; } catch (e) {}
			if (isGuide) { continue; }

			// 実体が 0x0（＝描かれていない）レイヤーも点として矩形を広げてしまうので除外する
			if (layerBounds.width == 0 && layerBounds.height == 0) { continue; }

			// 🛑 sourceRectAtTime は「回転前・スケール前」の矩形を返す。
			//    そのまま width/height を足すと、90度回転した縦組みテキスト等で
			//    外接矩形が過大になる(実害: 縦タブが幅80→134と算出された 2026-09-02)
			//    → 4隅にスケールと回転を掛けてから min/max を取る（applyLayerTransform）

			var cornerXList = [layerBounds.left, layerBounds.left + layerBounds.width];
			var cornerYList = [layerBounds.top, layerBounds.top + layerBounds.height];

			for (var cx = 0; cx < 2; cx++)
			{
				for (var cy = 0; cy < 2; cy++)
				{
					var pt = applyLayerTransform( [cornerXList[cx], cornerYList[cy]], layer );

					// 🛑 親子付きレイヤーの position は「親の座標系」の値。
					//    そのままコンポ座標として扱うと矩形が破綻する（実害 2026-09-05・Overlord v2 の入れ子グループ）
					//    親を1段ずつ遡って、そのつど親のアンカーを引いてから変換する
					var par = layer.parent;
					while (par != null)
					{
						pt = applyLayerTransform( pt, par );
						par = par.parent;
					}

					minX = Math.min(minX, pt[0]);
					minY = Math.min(minY, pt[1]);
					maxX = Math.max(maxX, pt[0]);
					maxY = Math.max(maxY, pt[1]);
				}
			}
		};

		// 全部が除外された場合（ガイドと空レイヤーしか選択されていない）
		if (minX == Infinity)
		{
			alert("選択レイヤーに実体がありません。\nガイドレイヤーと 0x0 のレイヤーは寸法算出から除外されます。");
			boundsFailed = true;
			return;
		}

		totalWidth = Math.ceil(maxX - minX);
		if (totalWidth % 2 != 0) {totalWidth += 1;}
		totalHeight = Math.ceil(maxY - minY);
		if (totalHeight % 2 != 0) {totalHeight += 1;}
		centerX = (maxX + minX) / 2;
		centerY = (maxY + minY) / 2;
}
// **** FUNCTION ******************************************************************************************************************
//		レイヤーグループプリコンポを作成
		function buildLayerGroupComp()
{
		// 選択レイヤーリストからレイヤーIndexを取得（プリコンポ名はダイアログで確定済み）
		var selectLayerIndexList = [];
		for (var i = 0; i < selectLayerList.length; i++) {
			selectLayerIndexList.push(selectLayerList[i].index);
		}

		// 選択レイヤーをプリコンポーズ
		var layerGroupComp = activeComp.layers.precompose( selectLayerIndexList , preCompName, true );
		
		// 一時的な親ヌルシェイプレイヤーを作成
		var tempParent = layerGroupComp.layers.addShape();
		tempParent.name = "Temporary Parent Null";
		tempParent.guideLayer = true;
		tempParent.property("Transform").property("Position").setValue([centerX, centerY]);

		// 選択レイヤーの親を一時的な親ヌルに設定
		var curlayerList = layerGroupComp.layers;
		for (var i = 2; i <= curlayerList.length; i++) {
			if (curlayerList[i].parent == null) {curlayerList[i].parent = tempParent;}
		}
		
		// コンポジションのサイズを変更
		layerGroupComp.width = totalWidth + magineSize*2;
		layerGroupComp.height = totalHeight + magineSize*2;

		// 親ヌル位置をプリコンポ中央へ移動
		var curCompCenter = [layerGroupComp.width/2, layerGroupComp.height/2];
		tempParent.property("Transform").property("Position").setValue( curCompCenter );
		
		// 一時的な親ヌルを削除
		tempParent.remove();
		
		// レイヤーグループプリコンポを元の位置にオフセット
		var layerGroupLayer = activeComp.layer(layerGroupComp.name);
		layerGroupLayer.property("Transform").property("Position").setValue([centerX, centerY]);

		// デフォルトカメラの位置・目標点・ズームをリセット
		curComp = layerGroupComp;
		scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "resetDefaultCamera.jsx" );

}
// **** FUNCTION ******************************************************************************************************************
//		スクリプトファイルの実行
		function scriptExecute( scriptFilePath )
{
		var scriptFileName = new File( scriptFilePath );
		scriptFileName.open();
		eval(scriptFileName.read());
		scriptFileName.close();
}

// **** FUNCTION ******************************************************************************************************************
//		捕まえた例外を必ず画面に出す（ランチャー経由でも消えないように）
		function reportScriptError( err )
{
		try { app.endUndoGroup(); } catch ( e ) {}// 開いたままのundoグループを閉じる

		var msg = ( err && err.message ) ? err.message : String( err );
		if ( err && err.line ) { msg += "\n" + "line : " + err.line; }
		if ( err && err.fileName ) { msg += "\n" + "file : " + File.decode( err.fileName ); }

		alert( curScriptName + " stopped." + "\n" + "\n" + msg, curScriptName );

		clearOutput();
		writeLn( curScriptName + " : stopped by an error" );
		writeLn( msg );
}