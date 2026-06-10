// Para Ver.1.04
// Copyright (c) 2007-2021 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2021/10/29
// 選択レイヤーの上にコンポサイズの平面 or シェイプを作成して、パラレイヤーとして配置します。

var curScriptName = "Para";

// **** Main Script ***************************************************************************************************************
var selectLayerList = new Array();
scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedLayer.jsx" );

app.beginUndoGroup( curScriptName );
var activeItem = app.project.activeItem;
if ( activeItem != null && activeItem instanceof CompItem )
{
	var ac = 1;
	for ( i = 1; i <= activeItem.numLayers; i++ )
	{
		if (activeItem.layer(i).name.match(/^Para/g)) {ac++};
	}

	var PLsolid = addSolid( ac );//平面
	//var PLsolid = addShape( ac );//シェイプ

	if ( selectLayerList.length > 0 ) PLsolid.moveBefore( selectLayerList[0] );//選択レイヤー上に移動

	PLsolid.label = 10;//ラベルをパープルにする
	var curMarker = new MarkerValue("Para");
	PLsolid.property("ADBE Marker").setValueAtTime( 0 , curMarker );//マーカーを作成
	PLsolid.preserveTransparency = true;//「下の透明部分を保持」をオン
	PLsolid.blendingMode = BlendingMode.MULTIPLY;//乗算合成
	PLsolid.opacity.setValue( 75 );//不透明度75%
	
	var curW = activeComp.width;
	var curH = activeComp.height;
	var curD = roundToeven(Math.sqrt(curW*curW+curH*curH));//コンポの対角線の長さ
	
	//円形マスク作成
	var maskGroup = PLsolid.mask.addProperty('ADBE Mask Atom');
	maskGroup.name = 'Radial'; //マスクシェイプの名前
	var curShape = new Shape();
	if ( PLsolid.source != null )
	{ curShape.vertices = [[curW/2,0],[curW,curH/2],[curW/2,curH],[0,curH/2]]; }
	else
	{ curShape.vertices = [[0,-curH/2],[curW/2,0],[0,curH/2],[-curW/2,0]]; }
	var TAN = 3.62;
	curShape.inTangents = [[-curW/TAN,0],[0,-curH/TAN],[curW/TAN,0],[0,curH/TAN]];
	curShape.outTangents = [[curW/TAN,0],[0,curH/TAN],[-curW/TAN,0],[0,-curH/TAN]]; 	
	maskGroup.maskShape.setValue(curShape);//マスク作成
	maskGroup.maskMode = MaskMode.SUBTRACT;//マスクモードを減算に
	maskGroup.property("ADBE Mask Feather").setValueAtTime( 0 , [curH/4,curH/4] );//マスク境界線ブラー
	maskGroup.property("ADBE Mask Offset").setValueAtTime( 0 , 0 );//マスク拡張

	//線形マスク作成
	var maskGroup = PLsolid.mask.addProperty('ADBE Mask Atom');
	maskGroup.name = 'Linear'; //マスクシェイプの名前
	var curShape = new Shape();
	if ( PLsolid.source != null )
	{ curShape.vertices = [[curW/2-curD/2-curH/4,curH/4],[curW/2+curD/2+curH/4,curH/4],[curW/2+curD/2+curH/4,curH/4*3],[curW/2-curD/2-curH/4,curH/4*3]]; }
	else
	{ curShape.vertices = [[-curD/2-curH/4,-curH/4],[curD/2+curH/4,-curH/4],[curD/2+curH/4,curH/4],[-curD/2-curH/4,curH/4]]; }
	maskGroup.maskShape.setValue(curShape);//マスク作成
	maskGroup.maskMode = MaskMode.NONE;//マスクモードをなしに
	maskGroup.property("ADBE Mask Feather").setValueAtTime( 0 , [curH/4,curH/4] );//マスク境界線ブラー
	maskGroup.property("ADBE Mask Offset").setValueAtTime( 0 , 0 );//マスク拡張
	
	//塗りを適用
	var curFx = PLsolid.property("ADBE Effect Parade").addProperty("ADBE Fill");
	curFx.name = "Para_Color";
	curFx("ADBE Fill-0002").setValue( [0,0,0,1] );//Color
	
	//アルファレベルを適用
	var curFx = PLsolid.property("ADBE Effect Parade").addProperty("ADBE Alpha Levels3");
	curFx.name = "Para_Tone";
	curFx("ADBE Alpha Levels3-0002").setValue( 220/255 );//Input White Level
	curFx("ADBE Alpha Levels3-0003").setValue( 0.6 );//Gamma
	
	//拡散を適用
	var curFx = PLsolid.property("ADBE Effect Parade").addProperty("ADBE Scatter");
	curFx.name = "Para_Scatter";
	curFx("ADBE Scatter-0001").setValue( 10 );//Scatter Amount
}
app.endUndoGroup();
scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "collectSolids.jsx" );
// **** FUNCTION ******************************************************************************************************************
//		平面を作成
		function addSolid( ac )
{
		var PLsolid = activeItem.layers.addSolid([0,0,0], "Para"+ac.toString(10), activeItem.width, activeItem.height, 1, 1000/24) ;//新規平面作成
		PLsolid.position.expression = "X = thisComp.width; Y = thisComp.height; [X,Y]/2";//位置をコンポジション中央に固定
		PLsolid.scale.expression = "X = 100/thisLayer.width*thisComp.width; Y = 100/thisLayer.height*thisComp.height; [X,Y]";
		return PLsolid;
}
// **** FUNCTION ******************************************************************************************************************
//		シェイプを作成
		function addShape( ac )
{
		var PLshape = activeItem.layers.addShape();//新規シェイプレイヤー作成
		PLshape.name = "Para"+ac.toString(10);//名称変更
		PLshape.position.expression = "X = thisComp.width; Y = thisComp.height; [X,Y]/2";//位置をコンポジション中央に固定	
		var Rect = PLshape.property("ADBE Root Vectors Group").addProperty("ADBE Vector Shape - Rect");
		Rect.property("ADBE Vector Rect Size").expression = "X = thisComp.width; Y = thisComp.height; [X,Y]";
		var Fill = PLshape.property("ADBE Root Vectors Group").addProperty("ADBE Vector Graphic - Fill");
		Fill.property("ADBE Vector Fill Color").setValue( [0,0,0,1] );
		return PLshape;
}
// **** FUNCTION ******************************************************************************************************************
//		偶数丸め込み処理
		function roundToeven(V) 
		{ 
			if (V%2 < 1)
			{ if (V%2 == 0) {Int = V;} else {Int = Math.floor(V);} }
			else
			{ Int = Math.floor(V)+1; } 

			return Int; 
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