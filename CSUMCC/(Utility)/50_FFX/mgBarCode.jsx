// mgBarCode Ver.1.01
// Copyright (c) 2007-2020 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2026/09/12
// 

var curScriptName = "mgBarCode";

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
		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
		curFx.name = "Fractal Noise";
		curFx("ADBE Fractal Noise-0001").setValue( 8 );//Fractal Type
		curFx("ADBE Fractal Noise-0002").setValue( 1 );//Noise Type
		curFx("ADBE Fractal Noise-0004").setValue( 250 );//Contrast
		curFx("ADBE Fractal Noise-0005").setValue( -25 );//Brightness
		curFx("ADBE Fractal Noise-0009").setValue( 0 );//Uniform Scaling
		curFx("ADBE Fractal Noise-0010").setValue( 10 );//Scale
		curFx("ADBE Fractal Noise-0011").setValue( 4 );//Scale Width
		curFx("ADBE Fractal Noise-0012").setValue( 2000 );//Scale Height
		curFx("ADBE Fractal Noise-0013").setValue( [0,0] );//Offset Turbulence
		curFx("ADBE Fractal Noise-0015").setValue( 2 );//Complexity

		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Posterize");
		curFx.name = "Posterize";
		curFx("ADBE Posterize-0001").setValue( 4 );//Level
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