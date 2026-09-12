// CompOptimizer Ver.1.0.2
// Copyright (c) 2007-2023 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2026/09/12
// プロジェクト内の全コンポジションの開始フレームを1、背景色を黒に変更
// デフォルトカメラの位置・目標点・ズームをリセットする

var curScriptName = "CompOptimizer";

// **** ERROR GUARD ***************************************************************************************************************
//		ランチャー（CL_Extra / KBar 等）のボタンから起動すると、ScriptUIのイベントハンドラ内で起きた
//		例外を After Effects は報告しない＝失敗しても「黙って終わった」ようにしか見えない
//		（実測と経緯 = docs/INCIDENTS.md 2026-09-03／型の見本 = EditCompSettings.jsx v5.4）。
//		実行ブロック全体をここで囲み、例外は必ず自前で alert に出す。
try {

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

} catch ( err ) { reportScriptError( err ); }
// **** ERROR GUARD END ***********************************************************************************************************
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