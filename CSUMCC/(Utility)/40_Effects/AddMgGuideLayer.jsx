// AddMgGuideLayer Ver.1.00
// Copyright (c) 2007-2020 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2020/10/21
// アクティブコンポにMGガイドのシェイプレイヤーを作成します。

var curScriptName = "AddMgGuideLayer";

// **** Main Script ***************************************************************************************************************
app.beginUndoGroup( curScriptName );

var activeComp = app.project.activeItem;
if ( activeComp != null && activeComp instanceof CompItem )
{
	n = activeComp.numLayers;
	//最上位選択レイヤー検出
	var selectedLayer = null;
	for ( i = 1; i <= n; i++ )
	{
        if ( activeComp.layer(i).selected == true ) { selectedLayer = activeComp.layer(i); break; } 
    }
	//レイヤー名末尾番号検出
	var ac = 1;
	for ( i = 1; i <= n; i++ )
	{
		if (activeComp.layer(i).name.match(/^mg/i)) { ac++; }
	}

	var BaseShape = activeComp.layers.addShape();//新規シェイプレイヤー作成
	if ( selectedLayer == null )
	{ BaseShape.moveToBeginning(); }//最上位に配置
	else
	{ BaseShape.moveBefore( selectedLayer ); }//選択レイヤーの上に配置
	BaseShape.startTime = activeComp.time;
	//レイヤー名変更
	if ( ac > 1 )
	{ BaseShape.name = "MG"+ac.toString( 10 ); }
	else
	{ BaseShape.name = "MG"; }

	BaseShape.label = 11;//レイヤーラベル変更 Orange
	BaseShape.position.setValue( [0,0] );

	//新規マーカーを作成
	var mv = new MarkerValue( "MG"+ac.toString( 10 ) ); 
	BaseShape.property("Marker").setValueAtTime( activeComp.time , mv );
	
	//var Rect = BaseShape.property("ADBE Root Vectors Group").addProperty("ADBE Vector Shape - Rect");
	//Rect.property("ADBE Vector Rect Size").expression = "[width,height]";
	//var Fill = BaseShape.property("ADBE Root Vectors Group").addProperty("ADBE Vector Graphic - Fill");
	//Fill.property("ADBE Vector Fill Color").setValueAtTime( 0 , [0,0,0,1] );
	//BaseShape.property("ADBE Effect Parade").addProperty("エフェクト名");//エフェクト適用
	//BaseShape.blendingMode = BlendingMode.SCREEN;//スクリーン合成
}
app.endUndoGroup();