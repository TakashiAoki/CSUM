// AddBaseLayer Ver.1.00
// Copyright (c) 2007-2019 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2019/05/01
// アクティブコンポにコンポサイズのシェイプレイヤーを作成し、最背面レイヤーに配置します。

var curScriptName = "AddBaseLayer";

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