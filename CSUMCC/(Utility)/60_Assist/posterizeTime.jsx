// posterizeTime Ver.1.6
// Copyright (c) 2007-2019 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2019/04/23
// エクスプレッション『posterizeTime(framesPerSecond)』を適用

var curScriptName = "posterizeTime";

// **** Main Script ***************************************************************************************************************
var selectPropertyList = new Array();
scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedProperty.jsx" );

if ( selectPropertyList.length > 0 )
{
	var X = prompt("framesPerSecond", 24 );//ダイアログ	
	expPosterizeTime = "posterizeTime( "+X+" );";
	
	app.beginUndoGroup( curScriptName );
	for( i = 0; i < selectPropertyList.length; i++ )
	{
		if ( selectPropertyList[i].expressionEnabled == true )
		{
			var curExp = selectPropertyList[i].expression;
			if ( curExp.match(/^posterizeTime/i) )
			{ selectPropertyList[i].expression = expPosterizeTime+CR+curExp.split(CR)[1]; }
			else
			{ selectPropertyList[i].expression = expPosterizeTime+CR+curExp; }
		}
		else
		{
			selectPropertyList[i].expression = expPosterizeTime+CR+"thisProperty;";
		}
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