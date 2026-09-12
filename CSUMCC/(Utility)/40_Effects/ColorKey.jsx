// ColorKey.jsx Ver.1.7
// ------------------------------------------------------------
// 選択レイヤーに対してカラーキー関連処理を実行
// ・対象レイヤーの取得（getSelectedLayer.jsx を利用）
// ・エフェクト適用／パラメータ設定
//
// Copyright (c) 2007-2026 Over Ray Studio
// Author : Takashi Aoki (@voyager_vision)
// Last Update : 2026/09/12
// ------------------------------------------------------------

var curScriptName = "ColorKey";

// **** ERROR GUARD ***************************************************************************************************************
//		ランチャー（CL_Extra / KBar 等）のボタンから起動すると、ScriptUIのイベントハンドラ内で起きた
//		例外を After Effects は報告しない＝失敗しても「黙って終わった」ようにしか見えない
//		（実測と経緯 = docs/INCIDENTS.md 2026-09-03／型の見本 = EditCompSettings.jsx v5.4）。
//		実行ブロック全体をここで囲み、例外は必ず自前で alert に出す。
try {

// **** Main Script ***************************************************************************************************************
var fxLayerList = [];
scriptExecute( myCSUMCCToolsFolder.fsName + "/getSelectedLayer.jsx" );

if ( fxLayerList.length > 0 )
{
	app.beginUndoGroup( curScriptName );
	for ( var i = 0; i < fxLayerList.length; i++ )
	{
		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Color Key");
		curFx("ADBE Color Key-0001").setValue( [1,1,1,1] );// Key Color
	}
	app.endUndoGroup();
}

} catch ( err ) { reportScriptError( err ); }
// **** ERROR GUARD END ***********************************************************************************************************
// **** FUNCTION ******************************************************************************************************************
//		スクリプトファイルの実行
		function scriptExecute( scriptFilePath )
{
		$.evalFile( scriptFilePath );

		/*
		var scriptFileName = new File( scriptFilePath );
		
		scriptFileName.open();
		eval( scriptFileName.read() );
		scriptFileName.close();
		*/
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