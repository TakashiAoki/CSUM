// posterizeTime Ver.1.7
// Copyright (c) 2007-2019 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2026/09/12
// エクスプレッション『posterizeTime(framesPerSecond)』を適用

var curScriptName = "posterizeTime";

// **** ERROR GUARD ***************************************************************************************************************
//		ランチャー（CL_Extra / KBar 等）のボタンから起動すると、ScriptUIのイベントハンドラ内で起きた
//		例外を After Effects は報告しない＝失敗しても「黙って終わった」ようにしか見えない
//		（実測と経緯 = docs/INCIDENTS.md 2026-09-03／型の見本 = EditCompSettings.jsx v5.4）。
//		実行ブロック全体をここで囲み、例外は必ず自前で alert に出す。
try {

// **** Main Script ***************************************************************************************************************
var selectPropertyList = new Array();
scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedProperty.jsx" );

if ( selectPropertyList.length > 0 )
{
	var X = prompt("framesPerSecond", 24 );//ダイアログ	
	expPosterizeTime = "posterizeTime( "+X+" );";
	
	app.beginUndoGroup( curScriptName );
	for( i = 0; i < selectPropertyList.length; i++ )
	{
		if ( selectPropertyList[i].expressionEnabled == true )
		{
			var curExp = selectPropertyList[i].expression;
			if ( curExp.match(/^posterizeTime/i) )
			{ selectPropertyList[i].expression = expPosterizeTime+CR+curExp.split(CR)[1]; }
			else
			{ selectPropertyList[i].expression = expPosterizeTime+CR+curExp; }
		}
		else
		{
			selectPropertyList[i].expression = expPosterizeTime+CR+"thisProperty;";
		}
	}
	app.endUndoGroup();
}

} catch ( err ) { reportScriptError( err ); }
// **** ERROR GUARD END ***********************************************************************************************************
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