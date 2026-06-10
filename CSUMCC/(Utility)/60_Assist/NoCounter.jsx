// NoCounter.jsx Ver.1.0
// ------------------------------------------------------------
// 選択テキストレイヤーに対して数値カウンター関連処理を実行
// ・対象レイヤーの取得（getSelectedLayer.jsx を利用）
// ・エフェクト適用／パラメータ設定
//
// Copyright (c) 2007-2026 Over Ray Studio
// Author : Takashi Aoki (@voyager_vision)
// Last Update : 2026/01/05
// ------------------------------------------------------------

var curScriptName = "NoCounter";
// **** Main Script ***************************************************************************************************************
var fxLayerList = [];
scriptExecute( myCSUMCCToolsFolder.fsName + "/getSelectedLayer.jsx" );

if ( fxLayerList.length > 0 )
{
	app.beginUndoGroup( curScriptName );
	for ( var i = 0; i < fxLayerList.length; i++ )
	{
		if ( fxLayerList[i] instanceof TextLayer )
		{
			// スライダー制御を適用
			var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Slider Control");
			curFx.name = "Value";
			curFx("ADBE Slider Control-0001").setValueAtTime( 0 , 0 );//Slider

			// スライダー制御を適用
			var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Slider Control");
			curFx.name = "TopZero";
			curFx("ADBE Slider Control-0001").setValue( 0 );//Slider

			// スライダー制御を適用
			var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Slider Control");
			curFx.name = "EndZero";
			curFx("ADBE Slider Control-0001").setValue( 0 );//Slider

			var curTex = fxLayerList[i].Text.property("ADBE Text Document");
			//var curTexVal = curTex.value.toString();
			// エクスプレッションを適用
			var Q = "\"";
			curTex.expression =
				"V = effect(" + Q + "Value" + Q + ")(1).value;" +CR+
				"ZeroFill = " + Q + "000000000000" + Q + ";" +CR+
				"TopZero = effect(" + Q + "TopZero" + Q + ")(1).value; //先頭の0の数" +CR+
				"EndZero = effect(" + Q + "EndZero" + Q + ")(1).value; //末尾の0の数" +CR+
				"//整数設定" +CR+
				"N = Math.floor(Math.abs(V)).toString();" +CR+
				"if (N.length < TopZero) {N = (ZeroFill + N).slice(-TopZero);}" +CR+
				"if (V < 0) { N = " + Q + "-" + Q + " + N; }//入力値が負の数の場合" +CR+
				"//少数設定" +CR+
				"if (V == 0) {D = ZeroFill.slice(0, EndZero);}" +CR+
				"else" +CR+
				"{" +CR+
				"	V = Math.abs(V);" +CR+
				"	if (V.toString().indexOf(" + Q + "." + Q + ") > 0)" +CR+
				"	{D = ((V * 100 - Math.floor(V) * 100) / 100).toString().split(" + Q + "." + Q + ")[1];}" +CR+
				"	else" +CR+
				"	{D = " + Q + "0" + Q + ";}" +CR+
				"	D = (D + ZeroFill).slice(0, EndZero);" +CR+
				"}" +CR+
				"if (EndZero == 0) {N;} else {N + " + Q + "." + Q + " + D;}";// Source Text
		}
	}
	app.endUndoGroup();
}
// **** FUNCTION ******************************************************************************************************************
//		スクリプトファイルの実行
		function scriptExecute( scriptFilePath )
{
		$.evalFile( scriptFilePath );
}