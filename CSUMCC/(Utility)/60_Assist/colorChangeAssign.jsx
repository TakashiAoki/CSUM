// ============================================
// Script Name : colorChangeAssign
// Version     : v1.0
// 仕様        : ColorChangeに色を割り当てる（カラーモデル色取得レイヤー専用）
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-05-23
// ============================================

var curScriptName = "colorChangeAssign";

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

// **** FUNCTION ****
function scriptExecute( scriptFilePath ) {
	var scriptFileName = new File( scriptFilePath );
	scriptFileName.open();
	eval(scriptFileName.read());
	scriptFileName.close();
}
