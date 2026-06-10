// Outline Ver.1.00
// Copyright (c) 2007-2018 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2018/08/17
// エフェクト･ベガスでアウトラインを適用

var curScriptName = "Outline";

// **** Main Script ***************************************************************************************************************
var fxLayerList = new Array();
scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedLayer.jsx" );

if ( fxLayerList.length > 0 )
{
	app.beginUndoGroup( curScriptName );
	for( i = 0; i < fxLayerList.length; i++ )
	{
		var inPoint = fxLayerList[i].inPoint;
		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("APC Vegas");
		curFx.name = "Outline";
		curFx("APC Vegas-0010").setValue( 5 );//Channel
		curFx("APC Vegas-0028").setValue( 1 );//Segments
		curFx("APC Vegas-0008").setValue( 1 );//Blend Mode
		curFx("APC Vegas-0018").setValueAtTime( inPoint , [1,1,1,1] );//Color
		curFx("APC Vegas-0020").setValueAtTime( inPoint , 2 );//Width
		curFx("APC Vegas-0022").setValue( 1 );//Hardness
		curFx("APC Vegas-0042").setValue( 1 );//End Opacity
	}
	app.endUndoGroup();
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