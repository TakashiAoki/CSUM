// CompOptimizer Ver.1.0.1
// Copyright (c) 2007-2023 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2023/04/18
// プロジェクト内の全コンポジションの開始フレームを1、背景色を黒に変更
// デフォルトカメラの位置・目標点・ズームをリセットする

for ( var i = 1; i <= app.project.numItems; i++ )
{
	if (app.project.item(i) instanceof CompItem)
	{
		curComp = app.project.item(i);
        SetCompStartTime1( curComp );
        curComp.bgColor = [0,0,0];
		SceneFilterSetUp( curComp );
		// デフォルトカメラの位置・目標点・ズームをリセット
		scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "resetDefaultCamera.jsx" );
	}
}
// **** FUNCTION ******************************************************************************************************************
//	コンポジションの開始フレームを1に変更
	function SetCompStartTime1( curComp )
{
	var appDisplayStartFrame = app.project.displayStartFrame;//プロジェクト設定の開始フレーム
	var activeCompFrameRate = curComp.frameRate;
	if( appDisplayStartFrame == 1 )
	{
		//プロジェクト設定が開始フレームが"1から開始"だった場合
		curComp.displayStartTime = 0;
	}
	else
	{
		//プロジェクト設定が開始フレームが"0から開始"だった場合
		curComp.displayStartTime = 1/activeCompFrameRate;
	}
}
// **** FUNCTION ******************************************************************************************************************
//	コメント欄に「#SceneFilter」の表記があったら適用された「ブレンド」エフェクトのレイヤー選択を「02_camera」にする
	function SceneFilterSetUp( curComp )
{
	if ( curComp.name.match(/03_filter/i) )
	{
		for ( l = 1; l <= curComp.numLayers; l++ )
		{
			if ( curComp.layer(l).comment.match(/#SceneFilter/igm))
			{
				var curLayer = curComp.layer(l);
				for(var e=1; e<=curLayer.property("Effects").numProperties; e++)
				{
					if ( curLayer.property("Effects")(e).matchName == "ADBE Blend" )
					{
						for ( L = curComp.numLayers; L >= 1 ; L-- )
						{
							if ( curComp.layer(L).name.match(/02_camera/i) )
							{
								curLayer.property("Effects")(e)(1).setValue(L);
								break;
							}
						}
					}
				}
			}
		}
	}
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