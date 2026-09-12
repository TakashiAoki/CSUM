// ============================================
// Script Name : colorChangeAssign
// Version     : v1.1
// 仕様        : ColorChangeに色を割り当てる（カラーモデル色取得レイヤー専用）
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-09-12
// ============================================

var curScriptName = "colorChangeAssign";

// **** ERROR GUARD ***************************************************************************************************************
//		ランチャー（CL_Extra / KBar 等）のボタンから起動すると、ScriptUIのイベントハンドラ内で起きた
//		例外を After Effects は報告しない＝失敗しても「黙って終わった」ようにしか見えない
//		（実測と経緯 = docs/INCIDENTS.md 2026-09-03／型の見本 = EditCompSettings.jsx v5.4）。
//		実行ブロック全体をここで囲み、例外は必ず自前で alert に出す。
try {

// **** Main Script ****
var selectLayerList = new Array();
scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedLayer.jsx" );

if ( selectLayerList.length == 3 ) {
	app.beginUndoGroup( curScriptName );

	if (
		selectLayerList[0].Effects(1).matchName == "F's ColorChange"
		&&
		selectLayerList[1].Effects(1).matchName == "ADBE Color Control"
		&&
		selectLayerList[2].Effects(1).matchName == "ADBE Color Control"
	) {
		var FsCC = selectLayerList[0].Effects(1);
		var AFx = selectLayerList[1].Effects;
		var BFx = selectLayerList[2].Effects;
		var s = 0;
		for ( var p = 3; p <= FsCC.numProperties; p++ ) {
			if ( FsCC(p).value == 0 && s < 4 ) {
				FsCC(p+1).setValue( AFx(s+1)(1).value );
				FsCC(p+2).setValue( BFx(s+1)(1).value );
				FsCC(p).setValue( 1 );
				s++;
			}
		}
	}
	app.endUndoGroup();
} else {
	alert("ColorChange処理用のレイヤーを3つ選択して下さい");
}

} catch ( err ) { reportScriptError( err ); }
// **** ERROR GUARD END ***********************************************************************************************************
// **** FUNCTION ****
function scriptExecute( scriptFilePath ) {
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
