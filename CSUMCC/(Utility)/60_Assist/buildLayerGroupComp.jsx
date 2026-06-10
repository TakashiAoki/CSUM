// buildLayerGroupComp Ver1.1
// Copyright (c) 2007-2023 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2023/07/21
// 選択レイヤーをプリコンポーズして、プリコンポサイズを選択レイヤーサイズにリサイズ、プリコンポを元の位置にオフセットします

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

			var left = layerPos[0] - layerAnchor[0] + layerBounds.left;
			var top = layerPos[1] - layerAnchor[1] + layerBounds.top;
			var right = left + layerBounds.width;
			var bottom = top + layerBounds.height;

			minX = Math.min(minX, left);
			minY = Math.min(minY, top);
			maxX = Math.max(maxX, right);
			maxY = Math.max(maxY, bottom);
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