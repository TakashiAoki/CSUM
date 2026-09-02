// buildLayerGroupComp Ver1.2
// Copyright (c) 2007-2023 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2026/09/02
// 選択レイヤーをプリコンポーズして、プリコンポサイズを選択レイヤーサイズにリサイズ、プリコンポを元の位置にオフセットします
// Ver1.2 : 回転・スケールを掛けたレイヤーの外接矩形を正しく算出するよう修正（縦組みテキスト等）

var curScriptName = "buildLayerGroupComp";
var defMarginValue = 100;

// **** Main Script *****************************************************************************************************************
app.beginUndoGroup( curScriptName );

	if ( app.project.activeItem != null )
	{
		getSelectLayerList();
		if ( selectLayerList.length > 0 )
		{
			getMagineSize();
			getLayerBounds();
			buildLayerGroupComp();
		}
		else
		{ alert("レイヤーを1つ以上選択して下さい。"); }
	}

app.endUndoGroup();
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
//		プリコンポマージンサイズ取得ダイアログ
		function getMagineSize()
{
		magineSize = null;

		// ダイアログの作成
		var dialog = new Window("dialog", "Input value");
		dialog.orientation = "column";
		dialog.alignChildren = "left";

		var inputGroup = dialog.add("group");
		inputGroup.orientation = "row";
		inputGroup.add("statictext", undefined, "Magine Size：");
		var inputValue = inputGroup.add("edittext", undefined, defMarginValue);
		inputValue.active = true;
		inputValue.characters = 10;
		inputGroup.add("statictext", undefined, "px");

		var buttonsGroup = dialog.add("group");
		buttonsGroup.orientation = "row";
		buttonsGroup.alignment = "right";
		var cancelButton = buttonsGroup.add("button", undefined, "Cancel");
		var okButton = buttonsGroup.add("button", undefined, "OK");

		// OK ボタンの処理
		okButton.onClick = function() {
			var value = parseFloat(inputValue.text);
			if (!isNaN(value)) {
				magineSize = value;
				dialog.close();
			} else {
				alert("Invalid value. Please input again.");
			}
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
			var layerPos = layer.transform.position.value;
			var layerAnchor = layer.transform.anchorPoint.value;
			var layerScale = layer.transform.scale.value;

			// 🛑 sourceRectAtTime は「回転前・スケール前」の矩形を返す。
			//    そのまま width/height を足すと、90度回転した縦組みテキスト等で
			//    外接矩形が過大になる(実害: 縦タブが幅80→134と算出された 2026-09-02)
			//    → 4隅にスケールと回転を掛けてから min/max を取る
			var layerRot = 0;
			try { layerRot = layer.transform.rotation.value; }
			catch (e) { try { layerRot = layer.transform.zRotation.value; } catch (e2) { layerRot = 0; } }

			var rad = layerRot * Math.PI / 180;
			var cosR = Math.cos(rad);
			var sinR = Math.sin(rad);
			var cornerXList = [layerBounds.left, layerBounds.left + layerBounds.width];
			var cornerYList = [layerBounds.top, layerBounds.top + layerBounds.height];

			for (var cx = 0; cx < 2; cx++)
			{
				for (var cy = 0; cy < 2; cy++)
				{
					var localX = (cornerXList[cx] - layerAnchor[0]) * layerScale[0] / 100;
					var localY = (cornerYList[cy] - layerAnchor[1]) * layerScale[1] / 100;
					var compX = localX * cosR - localY * sinR + layerPos[0];
					var compY = localX * sinR + localY * cosR + layerPos[1];

					minX = Math.min(minX, compX);
					minY = Math.min(minY, compY);
					maxX = Math.max(maxX, compX);
					maxY = Math.max(maxY, compY);
				}
			}
		};

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
		// 選択レイヤーリストからレイヤーIndex・推奨プリコンポ名を取得
		var selectLayerIndexList = [];
		var preCompNameList = [];
		for (var i = 0; i < selectLayerList.length; i++) {
			selectLayerIndexList.push(selectLayerList[i].index);
			preCompNameList.push(selectLayerList[i].name);
		}
		var preCompName = preCompNameList.join();

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