// ============================================
// Script Name : Flare
// Version     : v1.03
// 仕様        : 選択レイヤーの上にシェイプレイヤー（スクリーン合成）を作成
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-05-23
// ============================================

var curScriptName = "Flare";

// **** Main Script ****
var selectLayerList = new Array();
scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedLayer.jsx" );

app.beginUndoGroup( curScriptName );
var activeItem = app.project.activeItem;
if ( activeItem != null && activeItem instanceof CompItem ) {
	n = activeItem.numLayers;
	ac = 1;
	for ( i = 1; i <= n; i++ ) {
		if ( activeItem.layer(i).name.match(/^Flare/g) ) { ac++; }
	}
	var PLshape = activeItem.layers.addShape();
	PLshape.position.expression = "X = thisComp.width; Y = thisComp.height; [X,Y]/2";
	if ( selectLayerList.length > 0 ) PLshape.moveBefore( selectLayerList[0] );
	PLshape.name = "Flare" + ac.toString( 10 );
	PLshape.label = 3;
	var curMarker = new MarkerValue("Flare");
	PLshape.property("ADBE Marker").setValueAtTime( 0 , curMarker );

	PLshape.blendingMode = BlendingMode.SCREEN;
	PLshape.opacity.setValue( 75 );

	var Rect = PLshape.property("ADBE Root Vectors Group").addProperty("ADBE Vector Shape - Rect");
	Rect.property("ADBE Vector Rect Size").expression = "X = thisComp.width; Y = thisComp.height; [X,Y]";
	var Fill = PLshape.property("ADBE Root Vectors Group").addProperty("ADBE Vector Graphic - Fill");
	Fill.property("ADBE Vector Fill Color").setValue( [0,0,0,1] );

	var curFx = PLshape.property("ADBE Effect Parade").addProperty("ADBE Ramp");
	curFx.name = "Flare_Gradation";
	curFx("ADBE Ramp-0001").setValue( [activeItem.width/2 , activeItem.height*-0.3333] );
	curFx("ADBE Ramp-0002").setValue( [219/255,240/255,255/255,1] );
	curFx("ADBE Ramp-0003").setValue( [activeItem.width/2 , activeItem.height/2] );
	curFx("ADBE Ramp-0004").setValue( [0,0,0,1] );
	curFx("ADBE Ramp-0005").setValue( 2 );

	curFx = PLshape.property("ADBE Effect Parade").addProperty("ADBE Geometry2");
	curFx.name = "Flare_Aspect";
	curFx("ADBE Geometry2-0011").setValue( false );
	curFx("ADBE Geometry2-0004").setValue( 400 );

	curFx = PLshape.property("ADBE Effect Parade").addProperty("ADBE Easy Levels2");
	curFx.name = "Flare_Tone";
	curFx("ADBE Easy Levels2-0004").setValue( 220/255 );
	curFx("ADBE Easy Levels2-0005").setValue( 0.6 );

	PLshape.property("ADBE Effect Parade")( 1 ).selected = true;
}
app.endUndoGroup();

// **** FUNCTION ****
function scriptExecute( scriptFilePath ) {
	var scriptFileName = new File( scriptFilePath );
	scriptFileName.open();
	eval(scriptFileName.read());
	scriptFileName.close();
}
