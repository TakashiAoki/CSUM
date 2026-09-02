// ============================================
// Script Name : delOuterObj
// Version     : v1.3
// 仕様        : アクティブコンポのカメラ範囲外の3Dレイヤーを削除
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-06-30
// ============================================
// v1.3 : AE2025動作確認。整形(タブ/コメント統一)・ヘッダー統一。
//        margin入力キャンセル時に誤削除しないようガード追加。
//        カメラ未検出時はクラッシュせず中断するようガード追加。
//        挙動は従来どおり(範囲外判定レイヤーは source.remove() で項目ごと削除)。
// 原典  : Ver.1.2 (c) 2007-2018 Over Ray Studio・Takashi Aoki @voyager_vision

var curScriptName = "delOuterObj";
var flag = null;
var camFound = false;

ProjectCheck();
if ( !flag ) CompSelectCheck();
if ( !flag ) {
	var activeItem = app.project.activeItem;
	var selectItem = app.project.selection;
	var marginInput = prompt( "Margin Size", 0 );// 余白サイズ
	if ( marginInput == null ) {
		flag = true;// キャンセル時は何もせず中断(誤削除防止)
	} else {
		margin = parseFloat( marginInput, 10 );
		if ( isNaN( margin ) ) margin = 0;
	}
	var targetCompName = null;
	var compWidth = null;
	var compHeight = null;
	var anchorPoint = null;
	CR = String.fromCharCode( 13 );// 改行コード
}

// **** Main Script ***************************************************************************************************************
if ( !flag ) ActiveCompDetection();
app.beginUndoGroup( curScriptName );
if ( !flag ) Get3Dcamera();
if ( !flag ) DelOuterObj();
app.endUndoGroup();

// **** FUNCTION ******************************************************************************************************************
//		プロジェクトの状態チェック
function ProjectCheck() {
	if ( app.project == null ) { flag = true; alert( "プロジェクトを開いて、コンポジションを1つ選択して下さい" ); }
}

// **** FUNCTION ******************************************************************************************************************
//		コンポジションの選択状態チェック
function CompSelectCheck() {
	if ( ( app.project.activeItem == null && app.project.selection.length == 0 ) || app.project.selection.length != 1 ) {
		flag = true; alert( "コンポジションを１つだけ選択して下さい" );
	}
}

// **** FUNCTION ******************************************************************************************************************
//		アクティブコンポ検出
function ActiveCompDetection() {
	if ( activeItem != null ) {
		if ( activeItem instanceof CompItem ) {
			activeComp = activeItem;
			targetCompName = activeComp.name;
			compWidth = activeComp.width;
			compHeight = activeComp.height;
			compDuration = activeComp.duration;
			compFrameRate = activeComp.frameRate;
		}
		if ( activeItem instanceof FootageItem ) { alert( "１つ以上のコンポジションを選択して下さい" ); flag = true; }
	}
}

// **** FUNCTION ******************************************************************************************************************
//		3Dカメラレイヤー取得
function Get3Dcamera() {
	var i;
	for ( i = 0; i < activeComp.numLayers; i++ ) {
		if ( activeComp.layers[i+1].matchName == "ADBE Camera Layer" ) {
			camLayer = activeComp.layers[i+1];
			camPosShape = activeItem.layers.addShape();// 新規シェイプレイヤー作成
			camPosShape.moveAfter( camLayer );// 選択レイヤー下に移動
			camPosShape.name = "camPos";
			camPosShape.parent = camLayer;
			camPosShape.threeDLayer = true;
			camPosShape.position.setValue( [0,0,0] );
			camPosShape.scale.expression = "thisLayer.toWorld(anchorPoint);";

			camIntShape = activeItem.layers.addShape();// 新規シェイプレイヤー作成
			camIntShape.moveAfter( camLayer );// 選択レイヤー下に移動
			camIntShape.name = "camInt";
			camIntShape.parent = camLayer;
			camIntShape.threeDLayer = true;
			camIntShape.position.setValue( [0,0,0] );
			camIntShape.position.setValue( [0,0,100] );
			camIntShape.scale.expression = "thisLayer.toWorld(anchorPoint);";

			camFound = true;
			break;
		}
	}
	if ( !camFound ) { flag = true; alert( "3Dカメラレイヤーが見つかりません" ); }// カメラ無しは中断
}

// **** FUNCTION ******************************************************************************************************************
//		カメラ範囲外3Dレイヤー削除
function DelOuterObj() {
	var i, n;
	delLayerList = new Array();
	for ( i = 0; i < activeComp.numLayers; i++ ) {
		curLayer = activeComp.layers[i+1];
		if ( curLayer.threeDLayer == true &&
			curLayer.matchName != "ADBE Camera Layer" &&
			curLayer.matchName != "ADBE Vector Layer" &&
			curLayer.name != "globalNull" )
		{
			curEffect = curLayer.property( "Effects" ).addProperty( "ADBE Point Control" );
			curEffect(1).expression = "thisLayer.toComp(anchorPoint);";
			if (
				( 0-margin > curEffect(1).value[0] || curEffect(1).value[0] > compWidth+margin )
				||
				( 0-margin > curEffect(1).value[1] || curEffect(1).value[1] > compHeight+margin )
			)
			{ curEffect.remove(); delLayerList.push( curLayer ); continue; }
			else
			{ curEffect.remove(); }

			curEffect = curLayer.property( "Effects" ).addProperty( "ADBE Slider Control" );
			curEffect(1).expression = "P = thisComp.layer(\"camPos\").transform.scale;"+CR+
				"A = thisComp.layer(\"camInt\").transform.scale;"+CR+
				"CP = thisLayer.toWorld(anchorPoint);"+CR+
				"AP = normalize(A-P);"+CR+
				"CPP = normalize(CP-P);"+CR+
				"X = AP-CPP;"+CR+
				"if ( Math.abs(X[0]) > 1 || Math.abs(X[1]) >1 || Math.abs(X[2]) > 1 ){ 0 } else { 1 }";
			if ( curEffect(1).value == 0 )
			{ delLayerList.push( curLayer ); continue; }
			else
			{ curEffect.remove(); curLayer.selected = true; }
		}
	}
	camIntShape.remove();
	camPosShape.remove();
	for ( n = 0; n < delLayerList.length; n++ ) { delLayerList[n].source.remove(); }
}
