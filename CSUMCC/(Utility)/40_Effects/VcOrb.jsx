// VcOrb Ver.1.00
// Copyright (c) 2007-2019 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2019/09/05
// エフェクト『VC Orb』を適用

var curScriptName = "VcOrb";

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
// **** FUNCTION ******************************************************************************************************************
//		スクリプトファイルの実行
		function scriptExecute( scriptFilePath )
{
		var scriptFileName = new File( scriptFilePath );
		scriptFileName.open();
		eval(scriptFileName.read());
		scriptFileName.close();
}