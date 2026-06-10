// ColorKey.jsx Ver.1.6
// ------------------------------------------------------------
// 選択レイヤーに対してカラーキー関連処理を実行
// ・対象レイヤーの取得（getSelectedLayer.jsx を利用）
// ・エフェクト適用／パラメータ設定
//
// Copyright (c) 2007-2026 Over Ray Studio
// Author : Takashi Aoki (@voyager_vision)
// Last Update : 2026/01/05
// ------------------------------------------------------------

var curScriptName = "ColorKey";

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