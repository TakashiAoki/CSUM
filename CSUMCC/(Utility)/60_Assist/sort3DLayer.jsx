// ============================================
// Script Name : sort3DLayer
// Version     : v1.3
// 仕様        : 選択3DLayerのLayer順を、同時選択した3Dカメラからの距離で並び替え
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-06-30
// ============================================
// v1.3 : AE2025動作確認。整形(タブ/コメント統一)・ヘッダー統一。
//        既存バグ修正: "seected"→"selected" タイポ(カメラ/globalNullの選択解除が不発だった)。
//        全角スペース除去。カメラ未検出時はクラッシュせず中断するようガード追加。
//        挙動は従来どおり(並び替え時に anchorPoint[50,50,0]・opacity100 のリセットも継続)。
// 原典  : Ver.1.2 (c) 2007-2018 Over Ray Studio・Takashi Aoki @voyager_vision

var curScriptName = "sort3DLayer";
var flag = null;
var selectLayerList = new Array();

// **** Main Script ***************************************************************************************************************
ProjectCheck();
if ( flag != true ) PropertySelectCheck();
if ( flag != true ) var activeItem = app.project.activeItem;
if ( flag != true ) getSelectLayerList();
app.beginUndoGroup( curScriptName );
if ( flag != true ) sort3DLayer();
app.endUndoGroup();

// **** FUNCTION ******************************************************************************************************************
//		プロジェクトの状態チェック
function ProjectCheck() {
	if ( app.project == null ) { flag = true;/* alert( "プロジェクトを開いて、１つ以上のレイヤーを選択して下さい" ); */ }
}

// **** FUNCTION ******************************************************************************************************************
//		レイヤーの選択状態チェック
function PropertySelectCheck() {
	if ( app.project.activeItem == null ) { flag = true;/* alert( "１つ以上のレイヤーを選択して下さい" ); */ }
}

// **** FUNCTION ******************************************************************************************************************
//		選択レイヤーリスト取得
function getSelectLayerList() {
	var i;
	if ( activeItem != null && activeItem instanceof CompItem ) {
		activeComp = activeItem;
		for ( i = 0; i < activeComp.numLayers; i++ ) {
			if (
				activeComp.layers[i+1].matchName == "ADBE Camera Layer"
				||
				activeComp.layers[i+1].name == "globalNull"
			)
			{ activeComp.layers[i+1].selected = false; }// v1.3 fix: seected→selected
		}
		selectLayerList = activeItem.selectedLayers;// レイヤーリスト
	}
	else
	{ flag = true;/* alert( "１つ以上のレイヤーを選択して下さい" ); */ }
}

// **** FUNCTION ******************************************************************************************************************
//		3Dレイヤーを並び替え
function sort3DLayer() {
	var i, n, m;
	var camFound = false;
	for ( i = 0; i < activeComp.numLayers; i++ ) {
		if ( activeComp.layers[i+1].matchName == "ADBE Camera Layer" ) {
			camLayer = activeComp.layers[i+1];
			var camPosShape = activeItem.layers.addShape();// 新規シェイプレイヤー作成
			camPosShape.moveAfter( camLayer );// 選択レイヤー下に移動
			camPosShape.name = "camPos";
			camPosShape.parent = camLayer;
			camPosShape.threeDLayer = true;
			camPosShape.position.setValue( [0,0,0] );
			camPosShape.scale.expression = "thisLayer.toWorld(anchorPoint);";
			camFound = true;
			break;
		}
	}
	if ( !camFound ) { alert( "3Dカメラレイヤーが見つかりません" ); return; }// カメラ無しは中断

	var sortList = new Array();
	for ( n = 0; n < selectLayerList.length; n++ ) {
		curLayer = selectLayerList[n];
		if ( curLayer.matchName != "ADBE Camera Layer" ) {
			curLayer.anchorPoint.setValue( [50,50,0] );
			curLayer.opacity.setValue( 100 );
			camDisFx = curLayer.property( "Effects" ).addProperty( "ADBE Slider Control" );
			camDisFx.name = "camDisFx";
			camDisFx(1).expression = "length(thisLayer.toWorld(anchorPoint), thisComp.layer(\"camPos\").transform.scale)";
			sortList.push( { key : curLayer, val : camDisFx(1).value } );
			camDisFx.remove();
		}
	}

	// 配列全体を処理したい場合 (例：並び順をチェック)
	/*
	str = "";
	for ( i = 0; i < sortList.length; i++ ) {
		str = str + sortList[i].key.name + " = " + sortList[i].val + String.fromCharCode(13);
	}
	alert( str );
	*/

	// バリュー ソート (値が大きい順)
	sortList.sort( largeVal );
	function largeVal( a, b ) { return ( a.val < b.val ) ? 1 : -1; }
	for ( m = 0; m < sortList.length; m++ ) {
		sortList[m].key.moveToBeginning();
	}

	camPosShape.remove();
}
