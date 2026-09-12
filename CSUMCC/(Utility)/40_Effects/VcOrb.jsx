// VcOrb Ver.1.01
// Copyright (c) 2007-2019 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2026/09/12
// エフェクト『VC Orb』を適用

var curScriptName = "VcOrb";

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
	for( i = 0; i < fxLayerList.length; i++ )
	{
		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("VIDEOCOPILOT Sphere");
        curFx.name = "VC Orb";
        curFx("VIDEOCOPILOT Sphere-0016").setValue( 300 );//Radius
        curFx("VIDEOCOPILOT Sphere-0050").setValue( 1 );//Surface
        curFx("VIDEOCOPILOT Sphere-0205").setValue( 0 );//Specular
        curFx("VIDEOCOPILOT Sphere-2003").setValue( 1 );//Unlit Only
        curFx("VIDEOCOPILOT Sphere-0502").setValue( fxLayerList[i].index );//Diffuse Layer
        curFx("VIDEOCOPILOT Sphere-0708").setValue( 2 );//UV Mode
        curFx("VIDEOCOPILOT Sphere-0704").setValue( 2 );//UV Repeat Y
        curFx("VIDEOCOPILOT Sphere-0707").setValue( 0 );//Box UV Feathering
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