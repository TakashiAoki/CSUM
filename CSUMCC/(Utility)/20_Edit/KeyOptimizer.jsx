// ============================================
// Script Name : KeyOptimizer
// Version     : v2.2
// 仕様        : 選択レイヤーの連続した同一値キーフレームを整理（イーズ・補間を保持）し、コンポ開始フレームを1に揃える
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-06-03
// ============================================
//
// v2.2 変更点:
//   - 高速化：全キー値を一度だけ読んで配列にキャッシュし、比較・冗長抽出をJS側で実施。
//     keyValue() の DOM 呼び出しを 1キー最大4回→1回に削減。挙動は不変。
//   - ValueKey の丸め係数をループ外へ退避（KEY_VALUE_FACTOR）。
// v2.1 変更点:
//   - 同値判定を toString 完全一致から「指定小数桁で丸めて一致」へ変更。
//     AEC4D（C4D由来）のベイク値に乗る浮動小数ノイズを吸収し、見た目静止の区間を確実に削減。
//     精度は KEY_VALUE_PRECISION で調整可能（小数N桁）。
//   - 情報パネルへの出力を英語化（MSG_* 定数）。
//     AEの情報パネル(writeLn)はUI言語ロケールに依存して多バイト文字を描画するため、
//     英語UIでは日本語が文字化けする。英語メッセージならどのUI言語でも正しく表示される。
//   - 情報パネルにバージョン表示を追加（最新版を実行しているかの確認用）。
// v2.0 変更点:
//   - キー削除を「全消去→再生成」から「冗長キーのみ removeKey」方式へ刷新。
//     生存キーのイーズ・ベジェハンドル・補間設定を完全保持する。
//   - app.executeCommand(21)（メニューID依存）を排除し removeKey() に統一。
//   - 全キー同値・単一キーは静的値化（アニメ不要キーを削除）。Time Remapping は保護。

var curScriptName = "KeyOptimizer";
var curScriptVersion = "v2.2";
var KEY_VALUE_PRECISION = 3;// 同値判定の丸め桁数（小数N桁）。これ以下の差は「同じ」とみなす。AEC4Dの浮動小数ノイズ対策
var KEY_VALUE_FACTOR = Math.pow( 10, KEY_VALUE_PRECISION );// 丸め係数（ループ外退避）

// 情報パネル出力メッセージ（英語UIでも化けないよう英語で固定）
var MSG_NEED_LAYER  = "Please select one or more layers.";
var MSG_TIME_PRE    = "Processing time: ";
var MSG_TIME_SUF    = " sec";
var MSG_REMOVED_SUF = " key(s) removed";

// **** Main Script ***************************************************************************************************************

	ProcessTimeCalculatStart();// 処理時間計算開始

	var selectLayerList = new Array();
	var removeKeysCount = 0;

	scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedLayer.jsx" );

	if ( selectLayerList.length == 0 )
	{
		alert( MSG_NEED_LAYER );
	}
	else
	{
		app.beginUndoGroup( curScriptName );

			UnselectProperty();// 選択プロパティを非選択にする
			SetCompStartTime1( activeComp );// コンポジションの開始フレームを1に変更
			FindPropertyWithKey( selectLayerList );
			AddFX( selectLayerList );// Null・Shapeレイヤーに追加処理

		app.endUndoGroup();

		// 情報パネルに結果を表示
		clearOutput();
		writeLn( curScriptName + " " + curScriptVersion );
		writeLn( ProcessTimeCalculatEnd() );// 処理時間計算終了
		writeLn( removeKeysCount + MSG_REMOVED_SUF );
	}

// **** FUNCTION ******************************************************************************************************************
//		処理時間計算
		function ProcessTimeCalculatStart()
{
	var dObj = new Date(); ptcStart = dObj.getTime() / 1000;
}

		function ProcessTimeCalculatEnd()
{
	var dObj = new Date(); ptcEnd = dObj.getTime() / 1000;
	return MSG_TIME_PRE + Math.round( ( ptcEnd - ptcStart ) * 1000 ) / 1000 + MSG_TIME_SUF;
}

// **** FUNCTION ******************************************************************************************************************
//		選択プロパティを非選択にする
		function UnselectProperty()
{
	var activeItem = app.project.activeItem;
	if ( activeItem != null && activeItem instanceof CompItem )
	{
		var selectPropertyList = activeItem.selectedProperties;// プロパティリスト
		for ( var u = 0; u < selectPropertyList.length; u++ )
		{
			selectPropertyList[u].selected = false;
		}
	}
}

// **** FUNCTION ******************************************************************************************************************
//		コンポジションの開始フレームを1に変更
		function SetCompStartTime1( curComp )
{
	if ( appDisplayStartFrame == 1 )
	{
		// プロジェクト設定が「1から開始」だった場合
		curComp.displayStartTime = 0;
	}
	else
	{
		// プロジェクト設定が「0から開始」だった場合
		curComp.displayStartTime = 1 / activeCompFrameRate;
	}
}

// **** FUNCTION ******************************************************************************************************************
//		選択レイヤーのキーフレームのあるプロパティを探します
		function FindPropertyWithKey( selectLayerList )
{
	var curLayers = selectLayerList;
	for ( var s = 0; s < curLayers.length; s++ )
	{
		for ( var pp = 1; pp <= curLayers[s].numProperties; pp++ )
		{
			var curProperty = curLayers[s].property( pp );
			if ( curProperty.propertyType == PropertyType.PROPERTY )
			{
				KeyOptimizer( curProperty );
			}
			for ( var p = 1; p <= curLayers[s].property( pp ).numProperties; p++ )
			{
				var curProperty = curLayers[s].property( pp ).property( p );
				if ( curProperty.propertyType == PropertyType.PROPERTY )
				{
					// 通常タイプのプロパティだった場合
					if ( curProperty.canVaryOverTime == true )
					{
						KeyOptimizer( curProperty );
					}
				}
				if ( curProperty.propertyType == PropertyType.NAMED_GROUP )
				{
					// メンバーの名称を変更できないプロパティグループ（トランスフォームなど）
					for ( var f = 1; f <= curProperty.numProperties; f++ )
					{
						if ( curProperty.property( f ).propertyType == PropertyType.PROPERTY )
						{
							if ( curProperty.property( f ).canVaryOverTime == true )
							{
								KeyOptimizer( curProperty.property( f ) );
							}
						}
					}
				}
			}
		}
	}
}

// **** FUNCTION ******************************************************************************************************************
//		プロパティの連続した同一値キーフレームを整理（イーズ・補間を保持）
		function KeyOptimizer( curProperty )
{
	// 方針:
	//   - キー0個      : 無視
	//   - 全キー同値    : 静的値化（アニメ不要なのでキーを全削除し値を固定）※Time Remapping は保護
	//   - 単一キー      : 上記「全キー同値」に内包され静的値化される ※Time Remapping は保護
	//   - キー3個以上   : 前後と同値の中間キー（冗長キー）のみ removeKey で削除。生存キーのイーズは保持
	//   - キー2個で別値  : 何もしない
	// 高速化: keyValue() は AE DOM 呼び出しでコストが高いため、全キー値を一度だけ読んで
	//         丸めキーを vkList にキャッシュし、以降の同値判定・冗長抽出はすべてJS側で行う。
	//         同値判定は ValueKey() の丸め比較（KEY_VALUE_PRECISION 桁）でAEC4Dの浮動小数ノイズを吸収。

	var numKeys = curProperty.numKeys;// numKeys も DOM 呼び出しなのでローカルへ
	if ( numKeys == 0 ) { return; }

	var isTimeRemap = ( curProperty.matchName == "ADBE Time Remapping" );

	// 全キー値を一度だけ読み、丸めキーを配列化（以降はDOM不要）
	var vkList = new Array();// vkList[1..numKeys]
	for ( var i = 1; i <= numKeys; i++ )
	{
		vkList[i] = ValueKey( curProperty.keyValue( i ) );
	}

	// 全キー同値判定（JSのみ）
	var allSame = !isTimeRemap;
	for ( var i = 2; allSame && i <= numKeys; i++ )
	{
		if ( vkList[i] != vkList[1] ) { allSame = false; }
	}

	if ( allSame )
	{
		// 全キーが同値 → 静的値化（値は元キーの値をそのまま保持）
		var holdValue = curProperty.keyValue( 1 );
		for ( var i = numKeys; i >= 1; i-- ) { curProperty.removeKey( i ); }
		curProperty.setValue( holdValue );
	}
	else if ( numKeys >= 3 )
	{
		// 冗長キー（前後と同値の中間キー）をJSキャッシュから抽出し、後方から削除
		var removeIndexList = new Array();
		for ( var i = 2; i <= numKeys - 1; i++ )
		{
			if ( vkList[i] == vkList[i - 1] && vkList[i] == vkList[i + 1] )
			{
				removeIndexList.push( i );
			}
		}
		for ( var r = removeIndexList.length - 1; r >= 0; r-- )
		{
			curProperty.removeKey( removeIndexList[r] );// 後方インデックスから削除して整合を保つ
		}
	}

	removeKeysCount = removeKeysCount + ( numKeys - curProperty.numKeys );
}

// **** FUNCTION ******************************************************************************************************************
//		プロパティ値（数値 or 配列）を丸めて同値比較用キー文字列にする
		function ValueKey( v )
{
	var factor = KEY_VALUE_FACTOR;
	if ( v instanceof Array )
	{
		var partsList = new Array();
		for ( var i = 0; i < v.length; i++ )
		{
			partsList[i] = Math.round( v[i] * factor ) / factor;
		}
		return partsList.join( "," );
	}
	return ( Math.round( v * factor ) / factor ).toString();
}

// **** FUNCTION ******************************************************************************************************************
//		Null・Shapeレイヤーに追加処理
		function AddFX( selectLayerList )
{
	var curLayers = selectLayerList;
	for ( var s = 0; s < curLayers.length; s++ )
	{
		if ( curLayers[s].nullLayer || curLayers[s] instanceof ShapeLayer )
		{
			var curFx = curLayers[s].property( "ADBE Effect Parade" ).addProperty( "ADBE Point Control" );// ポイント制御
			curFx.name = "curGlobalPoint";
			curFx( "ADBE Point Control-0001" ).expression = "thisLayer.toComp(anchorPoint);";
		}
		//if ( curLayers[s].nullLayer == true ) { curLayers[s].opacity.setValue(100); }
	}
}

// **** FUNCTION ******************************************************************************************************************
//		スクリプトファイルの実行
		function scriptExecute( scriptFilePath )
{
	var scriptFileName = new File( scriptFilePath );
	scriptFileName.open();
	eval( scriptFileName.read() );
	scriptFileName.close();
}
