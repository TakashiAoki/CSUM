// CreateShapesFromText Ver.1.01
// Copyright (c) 2007-2022 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2026/09/12
// 選択したテキストレイヤーをシェイプレイヤーに変換します

var curScriptName = "CreateShapesFromText";

// **** ERROR GUARD ***************************************************************************************************************
//		ランチャー（CL_Extra / KBar 等）のボタンから起動すると、ScriptUIのイベントハンドラ内で起きた
//		例外を After Effects は報告しない＝失敗しても「黙って終わった」ようにしか見えない
//		（実測と経緯 = docs/INCIDENTS.md 2026-09-03／型の見本 = EditCompSettings.jsx v5.4）。
//		実行ブロック全体をここで囲み、例外は必ず自前で alert に出す。
try {

// **** Main Script ***************************************************************************************************************
var fxLayerList = new Array();
scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedLayer.jsx" );

if ( fxLayerList.length > 0 )
{
	app.beginUndoGroup( curScriptName );
    textLayerList = getTextLayerList( selectLayerList );
    if ( 0 < textLayerList.length )
    {
		//選択レイヤーの選択を全解除
		for( i = 0; i < selectLayerList.length; i++ )
		{
			selectLayerList[i].selected = false;
        }
		//テキストレイヤーをシェイプレイヤーに変換
		for( i = 0; i < textLayerList.length; i++ )
		{
			textLayerList[i].selected = true;
			createShapesfromText();
			var curLayer = activeComp.layer(textLayerList[i].index-1);
			curLayer.label = textLayerList[i].label;//レイヤーラベル変更
			curLayer.selected = false;
        }
		//元のテキストレイヤーを選択
		for( i = 0; i < textLayerList.length; i++ )
		{
			textLayerList[i].selected = true;
        }
    }
	app.endUndoGroup();
}

} catch ( err ) { reportScriptError( err ); }
// **** ERROR GUARD END ***********************************************************************************************************
// **** FUNCTION ******************************************************************************************************************
//		選択レイヤーリストからテキストレイヤーリストを作成
		function getTextLayerList( selectLayerList )
{
		var textLayerList = [];
		for( i = 0; i < selectLayerList.length; i++ )
		{
			var curLayer = selectLayerList[i];
			if ( !( curLayer instanceof CameraLayer ) && !( curLayer instanceof LightLayer ) )
			{
				if ( curLayer instanceof TextLayer ){ textLayerList.push( curLayer ); continue; }//Text
			}
		}
		return textLayerList;
}
// **** FUNCTION ******************************************************************************************************************
//		選択レイヤーリストからテキストレイヤーリストを作成
		function createShapesfromText()
{
        if( $.locale == "en_US" ){ app.executeCommand(app.findMenuCommandId("Create Shapes from Text")); }
        if( $.locale == "ja_JP" ){ app.executeCommand(app.findMenuCommandId("テキストからシェイプを作成")); }
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