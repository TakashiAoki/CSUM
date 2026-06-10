// mgBarCode Ver.1.00
// Copyright (c) 2007-2020 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2020/01/26
// 

var curScriptName = "mgBarCode";

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
// **** FUNCTION ******************************************************************************************************************
//		スクリプトファイルの実行
		function scriptExecute( scriptFilePath )
{
		var scriptFileName = new File( scriptFilePath );
		scriptFileName.open();
		eval(scriptFileName.read());
		scriptFileName.close();
}