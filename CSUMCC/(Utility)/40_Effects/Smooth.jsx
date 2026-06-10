// ============================================
// Script Name : Smooth
// Version     : v1.02
// 仕様        : 選択レイヤーにエフェクト『OLM Smoother』を適用
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-05-23
// ============================================

var curScriptName = "Smooth";

// **** Main Script ****
var fxLayerList = new Array();
scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedLayer.jsx" );

if ( fxLayerList.length > 0 ) {
	app.beginUndoGroup( curScriptName );
	for ( i = 0; i < fxLayerList.length; i++ ) {
		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("OLM Smoother");
		curFx("OLM Smoother-0001").setValue( 1 );
	}
	app.endUndoGroup();
}

// **** FUNCTION ****
function scriptExecute( scriptFilePath ) {
	var scriptFileName = new File( scriptFilePath );
	scriptFileName.open();
	eval(scriptFileName.read());
	scriptFileName.close();
}
