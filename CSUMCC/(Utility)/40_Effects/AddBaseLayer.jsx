// AddBaseLayer Ver.1.01
// Copyright (c) 2007-2019 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2026/09/12
// アクティブコンポにコンポサイズのシェイプレイヤーを作成し、最背面レイヤーに配置します。

var curScriptName = "AddBaseLayer";

// **** ERROR GUARD ***************************************************************************************************************
//		ランチャー（CL_Extra / KBar 等）のボタンから起動すると、ScriptUIのイベントハンドラ内で起きた
//		例外を After Effects は報告しない＝失敗しても「黙って終わった」ようにしか見えない
//		（実測と経緯 = docs/INCIDENTS.md 2026-09-03／型の見本 = EditCompSettings.jsx v5.4）。
//		実行ブロック全体をここで囲み、例外は必ず自前で alert に出す。
try {

// **** Main Script ***************************************************************************************************************
app.beginUndoGroup( curScriptName );

var activeItem = app.project.activeItem;
if ( activeItem != null && activeItem instanceof CompItem )
{
	n = activeItem.numLayers;
	ac = 1;
	for ( i = 1; i <= n; i++ )
	{
		if (activeItem.layer(i).name.match(/^base/g)) {ac++};
	}
	var BaseShape = activeItem.layers.addShape();//新規シェイプレイヤー作成
	BaseShape.moveToEnd();//最背面レイヤーに配置
	BaseShape.label = 0;//レイヤーラベル変更 None
	BaseShape.position.expression = "[width,height]/2";
	
	if ( ac > 1 )
	{ BaseShape.name = "base"+ac.toString( 10 ); }
	else
	{ BaseShape.name = "base"; }
	
	var Rect = BaseShape.property("ADBE Root Vectors Group").addProperty("ADBE Vector Shape - Rect");
	Rect.property("ADBE Vector Rect Size").expression = "[width,height]";
	var Fill = BaseShape.property("ADBE Root Vectors Group").addProperty("ADBE Vector Graphic - Fill");
	Fill.property("ADBE Vector Fill Color").setValueAtTime( 0 , [0,0,0,1] );
	//BaseShape.property("ADBE Effect Parade").addProperty("エフェクト名");//エフェクト適用
	//BaseShape.blendingMode = BlendingMode.SCREEN;//スクリーン合成
}
app.endUndoGroup();

} catch ( err ) { reportScriptError( err ); }
// **** ERROR GUARD END ***********************************************************************************************************

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