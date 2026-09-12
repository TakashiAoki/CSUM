// colorPickRefresh Ver.1.2
// Copyright (c) 2007-2019 Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2026/09/12
// カラーモデル色取得レイヤー専用スクリプト:取得色を更新します

var curScriptName = "colorPickRefresh";

// **** ERROR GUARD ***************************************************************************************************************
//		ランチャー（CL_Extra / KBar 等）のボタンから起動すると、ScriptUIのイベントハンドラ内で起きた
//		例外を After Effects は報告しない＝失敗しても「黙って終わった」ようにしか見えない
//		（実測と経緯 = docs/INCIDENTS.md 2026-09-03／型の見本 = EditCompSettings.jsx v5.4）。
//		実行ブロック全体をここで囲み、例外は必ず自前で alert に出す。
try {

activeComp = null;
activeCompName = null;
activeCompWidth = null;
activeCompHeight = null;
activeCompDuration = null;
activeCompFrameRate = null;
activeCompStartTime = null;
appDisplayStartFrame = null;
selectLayerList = new Array();
fxLayerList = new Array();

// **** Main Script ***************************************************************************************************************
var selectLayerList = new Array();
if ( app.project.activeItem != null ) { getSelectLayerList(); }

app.beginUndoGroup( curScriptName );
for( i = 0; i < selectLayerList.length; i++ )
{
	selectLayerList[i].enabled = true;
	for ( var e = 1; e <= selectLayerList[i].Effects.numProperties; e++ )
	{
		if ( selectLayerList[i].Effects(e).enabled == true )
		{
			selectLayerList[i].Effects(e)(1).expressionEnabled = true;
			selectLayerList[i].Effects(e)(1).selected = true;
			if( $.locale == "en_US" ){ app.executeCommand(app.findMenuCommandId("Convert Expression to Keyframes")); }
			if( $.locale == "ja_JP" ){ app.executeCommand(app.findMenuCommandId("エクスプレッションをキーフレームに変換")); }
			selectLayerList[i].Effects(e)(1).selected = false;
		}
	}
	selectLayerList[i].enabled = false;
}
app.endUndoGroup();

} catch ( err ) { reportScriptError( err ); }
// **** ERROR GUARD END ***********************************************************************************************************
// **** FUNCTION ******************************************************************************************************************
//		選択レイヤーリスト取得
		function getSelectLayerList()
{
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
			fxLayerList = getFxLayerList( selectLayerList );
		}	
}
// **** FUNCTION ******************************************************************************************************************
//		選択レイヤーリストからエフェクト適用可能レイヤーリストを作成
		function getFxLayerList( selectLayerList )
{
		var fxLayerList = [];
		for( i = 0; i < selectLayerList.length; i++ )
		{
			var curLayer = selectLayerList[i];
			if ( !( curLayer instanceof CameraLayer ) && !( curLayer instanceof LightLayer ) )
			{
				if ( curLayer instanceof AVLayer && curLayer.width != 0 ){ fxLayerList.push( curLayer ); continue; }//Comp,Footage,Solid(サウンド以外)
				if ( curLayer instanceof ShapeLayer ){ fxLayerList.push( curLayer ); continue; }//Shape
				if ( curLayer instanceof TextLayer ){ fxLayerList.push( curLayer ); continue; }//Text
			}
		}
		return fxLayerList;
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