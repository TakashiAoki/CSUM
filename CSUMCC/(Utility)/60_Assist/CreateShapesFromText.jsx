// CreateShapesFromText Ver.1.00
// Copyright (c) 2007-2022 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2022/03/03
// 選択したテキストレイヤーをシェイプレイヤーに変換します

var curScriptName = "CreateShapesFromText";

// **** Main Script ***************************************************************************************************************
var fxLayerList = new Array();
scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedLayer.jsx" );

if ( fxLayerList.length > 0 )
{
	app.beginUndoGroup( curScriptName );
    textLayerList = getTextLayerList( selectLayerList );
    if ( 0 < textLayerList.length )
    {
		//選択レイヤーの選択を全解除
		for( i = 0; i < selectLayerList.length; i++ )
		{
			selectLayerList[i].selected = false;
        }
		//テキストレイヤーをシェイプレイヤーに変換
		for( i = 0; i < textLayerList.length; i++ )
		{
			textLayerList[i].selected = true;
			createShapesfromText();
			var curLayer = activeComp.layer(textLayerList[i].index-1);
			curLayer.label = textLayerList[i].label;//レイヤーラベル変更
			curLayer.selected = false;
        }
		//元のテキストレイヤーを選択
		for( i = 0; i < textLayerList.length; i++ )
		{
			textLayerList[i].selected = true;
        }
    }
	app.endUndoGroup();
}
// **** FUNCTION ******************************************************************************************************************
//		選択レイヤーリストからテキストレイヤーリストを作成
		function getTextLayerList( selectLayerList )
{
		var textLayerList = [];
		for( i = 0; i < selectLayerList.length; i++ )
		{
			var curLayer = selectLayerList[i];
			if ( !( curLayer instanceof CameraLayer ) && !( curLayer instanceof LightLayer ) )
			{
				if ( curLayer instanceof TextLayer ){ textLayerList.push( curLayer ); continue; }//Text
			}
		}
		return textLayerList;
}
// **** FUNCTION ******************************************************************************************************************
//		選択レイヤーリストからテキストレイヤーリストを作成
		function createShapesfromText()
{
        if( $.locale == "en_US" ){ app.executeCommand(app.findMenuCommandId("Create Shapes from Text")); }
        if( $.locale == "ja_JP" ){ app.executeCommand(app.findMenuCommandId("テキストからシェイプを作成")); }
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