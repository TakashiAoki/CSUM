// LinearWipe Ver.2.00
// Copyright (c) 2007-2021 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2021/10/06
// シェイプ・テキストレイヤーにエフェクト『リニアワイプ』を最適化して適用

var curScriptName = "LinearWipe";

// **** Main Script ***************************************************************************************************************
if ( app.project.activeItem != null && app.project.activeItem instanceof CompItem )
{
	var selectLayerList = new Array();
	scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedLayer.jsx" );

	if ( 0 < fxLayerList.length )
	{
		BuildAndShowDialog();//ダイアログ表示	
		if ( Btnon == "OK" )
		{
			app.beginUndoGroup( curScriptName );
			LinearWipe();//エフェクト適用
			app.endUndoGroup();
		}
	}
}
// **** FUNCTION ******************************************************************************************************************
//		ウィンドウ位置読み込み
		function loadWindowLocation( windowName, win )
{
		var sectionName = "CSUMCC " + curScriptName;
		var sectionKey = windowName + " Window Location";
		if ( app.settings.haveSetting( sectionName, sectionKey ) )
		{
			var curLocation = app.settings.getSetting( sectionName, sectionKey ).split( "," );
			win.location = [ Number( curLocation[0] ), Number( curLocation[1] ) ];
		}
		else { win.center(); }
}
// **** FUNCTION ******************************************************************************************************************
//		ウィンドウ位置記憶
		function saveWindowLocation( windowName, win )
{
		var sectionName = "CSUMCC " + curScriptName;
		var sectionKey = windowName + " Window Location";
		app.settings.saveSetting( sectionName, sectionKey, win.location[0] + "," + win.location[1] );
}
// **** FUNCTION ******************************************************************************************************************
//		ダイアログ表示
		function BuildAndShowDialog()
{
		var addHight = 24;
		
		cfxDlg = new Window ( "dialog" , curScriptName , [0,0,288,104+addHight*4] );
		
		modePnl = cfxDlg.add( "panel" , [16,16,272,52+addHight*4] , "Mode" );
		
			hICb = modePnl.add( "checkbox" , [16,20+addHight*0,160,20+addHight*1] , "H_IN" ); hICb.value = true;
			hOCb = modePnl.add( "checkbox" , [16,20+addHight*1,160,20+addHight*2] , "H_OUT" );
			vICb = modePnl.add( "checkbox" , [16,20+addHight*2,160,20+addHight*3] , "V_IN" );
			vOCb = modePnl.add( "checkbox" , [16,20+addHight*3,160,20+addHight*4] , "V_OUT" );
		
		cancelBtn = cfxDlg.add( "button" , [70,68+addHight*4,166,88+addHight*4] , "Cancel" , {name:"cancel"} );
		okBtn = cfxDlg.add( "button" , [176,68+addHight*4,272,88+addHight*4] , "OK" , {name:"ok"} );	
		
		cancelBtn.onClick = function() { Btnon = "Cancel"; cfxDlg.close(); }
		okBtn.onClick = function() { Btnon = "OK"; cfxDlg.close(); }
		
		cfxDlg.onMove = function() { saveWindowLocation( "cfxDlg", cfxDlg ) }
		loadWindowLocation( "cfxDlg", cfxDlg );
		cfxDlg.show();
}
// **** FUNCTION ******************************************************************************************************************
//		エフェクト適用
		function LinearWipe()
{
		for( i = 0; i < fxLayerList.length; i++ )
		{
			var CR = String.fromCharCode(13);//改行コード
			FPS = activeCompFrameRate;
			inPoint = fxLayerList[i].inPoint;

			expShapeTC =
			"if ( 1 < numKeys )" +CR+
			"{" +CR+
			"	var curLayer = thisLayer;" +CR+
			"	var anc = transform.anchorPoint;" +CR+
			"	var pos = transform.position;" +CR+
			"	var curSRaT = curLayer.sourceRectAtTime( time , true );" +CR+
			"	var pL = (pos[0]-anc[0]+curSRaT.left)/width;" +CR+
			"	var pR = (pos[0]-anc[0]+curSRaT.left+curSRaT.width)/width;" +CR+
			"	var pT = (pos[1]-anc[1]+curSRaT.top)/height;" +CR+
			"	var pB = (pos[1]-anc[1]+curSRaT.top+curSRaT.height)/height;" +CR+
			"	var Tc = thisProperty;" +CR+
			"	var curFxName = thisProperty.propertyGroup(1).name.split(" +"\""+ "_" +"\""+ ");" +CR+
			"	switch((curFxName[2]+" +"\""+ "_" +"\""+ "+curFxName[3]).toUpperCase())" +CR+
			"	{" +CR+
			"		case " +"\""+ "H_IN" +"\""+ " : 100-(pL+(pR-pL)*Tc/100)*100; break;" +CR+
			"		case " +"\""+ "H_OUT" +"\""+ " : (pL+(pR-pL)*Tc/100)*100; break;" +CR+
			"		case " +"\""+ "V_IN" +"\""+ " : 100-(pT+(pB-pT)*Tc/100)*100; break;" +CR+
			"		case " +"\""+ "V_OUT" +"\""+ " : (pT+(pB-pT)*Tc/100)*100; break;" +CR+
			"		default : 0;" +CR+
			"	}" +CR+
			"}" +CR+
			"else" +CR+
			"{0}";//Transition Completion

			expRasterTC =
			"if ( 1 < numKeys )" +CR+
			"{" +CR+
			"	var Tc = thisProperty;" +CR+
			"	var curFxName = thisProperty.propertyGroup(1).name.split(" +"\""+ "_" +"\""+ ");" +CR+
			"	switch((curFxName[2]+" +"\""+ "_" +"\""+ "+curFxName[3]).toUpperCase())" +CR+
			"	{" +CR+
			"		case " +"\""+ "H_IN" +"\""+ " : 100-Tc; break;" +CR+
			"		case " +"\""+ "H_OUT" +"\""+ " : Tc; break;" +CR+
			"		case " +"\""+ "V_IN" +"\""+ " : 100-Tc; break;" +CR+
			"		case " +"\""+ "V_OUT" +"\""+ " : Tc; break;" +CR+
			"		default : 0;" +CR+
			"	}" +CR+
			"}" +CR+
			"else" +CR+
			"{0}";//Transition Completion

			expWA =
			"var curFxName = thisProperty.propertyGroup(1).name.split(" +"\""+ "_" +"\""+ ");" +CR+
			"switch((curFxName[2]+" +"\""+ "_" +"\""+ "+curFxName[3]).toUpperCase())" +CR+
			"{" +CR+
			"	case " +"\""+ "H_IN" +"\""+ " : -90; break;" +CR+
			"	case " +"\""+ "H_OUT" +"\""+ " : 90; break;" +CR+
			"	case " +"\""+ "V_IN" +"\""+ " : 0; break;" +CR+
			"	case " +"\""+ "V_OUT" +"\""+ " : 180; break;" +CR+
			"	default : 0;" +CR+
			"}";//Wipe Angle

			if ( fxLayerList[i] instanceof ShapeLayer || fxLayerList[i] instanceof TextLayer )
			{
				//シェイプ･テキストレイヤー
				if ( hICb.value == true ){ Shape_H_IN(); }//水平イン
				if ( hOCb.value == true ){ Shape_H_OUT(); }//水平アウト
				if ( vICb.value == true ){ Shape_V_IN(); }//垂直イン
				if ( vOCb.value == true ){ Shape_V_OUT(); }//垂直アウト
			}
			else
			{
				//ラスタライズレイヤー
				if ( hICb.value == true ){ Raster_H_IN(); }//水平イン
				if ( hOCb.value == true ){ Raster_H_OUT(); }//水平アウト
				if ( vICb.value == true ){ Raster_V_IN(); }//垂直イン
				if ( vOCb.value == true ){ Raster_V_OUT(); }//垂直アウト
			}
		}
}
// **** FUNCTION ******************************************************************************************************************
//		シェイプ･テキストレイヤー : 水平イン
		function Shape_H_IN()
{
		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
		curFx.name = "Linear Wipe_Shape_H_IN";
		setEaseKey( curFx("ADBE Linear Wipe-0001"), FPS , inPoint );
		curFx("ADBE Linear Wipe-0001").expression = expShapeTC;//Transition Completion
		curFx("ADBE Linear Wipe-0002").expression = expWA;//Wipe Angle
}
// **** FUNCTION ******************************************************************************************************************
//		シェイプ･テキストレイヤー : 水平アウト
		function Shape_H_OUT()
{
		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
		curFx.name = "Linear Wipe_Shape_H_OUT";
		setEaseKey( curFx("ADBE Linear Wipe-0001"), FPS , inPoint );
		curFx("ADBE Linear Wipe-0001").expression = expShapeTC;//Transition Completion
		curFx("ADBE Linear Wipe-0002").expression = expWA;//Wipe Angle
}
// **** FUNCTION ******************************************************************************************************************
//		シェイプ･テキストレイヤー : 垂直イン
		function Shape_V_IN()
{
		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
		curFx.name = "Linear Wipe_Shape_V_IN";
		setEaseKey( curFx("ADBE Linear Wipe-0001"), FPS , inPoint );
		curFx("ADBE Linear Wipe-0001").expression = expShapeTC;//Transition Completion
		curFx("ADBE Linear Wipe-0002").expression = expWA;//Wipe Angle
}
// **** FUNCTION ******************************************************************************************************************
//		シェイプ･テキストレイヤー : 垂直アウト
		function Shape_V_OUT()
{
		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
		curFx.name = "Linear Wipe_Shape_V_OUT";
		setEaseKey( curFx("ADBE Linear Wipe-0001"), FPS , inPoint );
		curFx("ADBE Linear Wipe-0001").expression = expShapeTC;//Transition Completion
		curFx("ADBE Linear Wipe-0002").expression = expWA;//Wipe Angle
}
// **** FUNCTION ******************************************************************************************************************
//		ラスタライズレイヤー : 水平イン
		function Raster_H_IN()
{
		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
		curFx.name = "Linear Wipe_Raster_H_IN";
		setEaseKey( curFx("ADBE Linear Wipe-0001"), FPS , inPoint );
		curFx("ADBE Linear Wipe-0001").expression = expRasterTC;//Transition Completion
		curFx("ADBE Linear Wipe-0002").expression = expWA;//Wipe Angle
}
// **** FUNCTION ******************************************************************************************************************
//		ラスタライズレイヤー : 水平アウト
		function Raster_H_OUT()
{
		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
		curFx.name = "Linear Wipe_Raster_H_OUT";
		setEaseKey( curFx("ADBE Linear Wipe-0001"), FPS , inPoint );
		curFx("ADBE Linear Wipe-0001").expression = expRasterTC;//Transition Completion
		curFx("ADBE Linear Wipe-0002").expression = expWA;//Wipe Angle
}
// **** FUNCTION ******************************************************************************************************************
//		ラスタライズレイヤー : 垂直イン
		function Raster_V_IN()
{
		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
		curFx.name = "Linear Wipe_Raster_V_IN";
		setEaseKey( curFx("ADBE Linear Wipe-0001"), FPS , inPoint );
		curFx("ADBE Linear Wipe-0001").expression = expRasterTC;//Transition Completion
		curFx("ADBE Linear Wipe-0002").expression = expWA;//Wipe Angle
}
// **** FUNCTION ******************************************************************************************************************
//		ラスタライズレイヤー : 垂直アウト
		function Raster_V_OUT()
{
		var curFx = fxLayerList[i].property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
		curFx.name = "Linear Wipe_Raster_V_OUT";
		setEaseKey( curFx("ADBE Linear Wipe-0001"), FPS , inPoint );
		curFx("ADBE Linear Wipe-0001").expression = expRasterTC;//Transition Completion
		curFx("ADBE Linear Wipe-0002").expression = expWA;//Wipe Angle
}
// **** FUNCTION ******************************************************************************************************************
//		キーフレーム適用
		function setEaseKey( curProp , FPS , inPoint )
{
		curProp.setValuesAtTimes( [inPoint,inPoint+8/FPS] , [0,100] );
		var easeIn = new KeyframeEase( 0 , 90 );
		var easeOut = new KeyframeEase( 0 , 90 );
		for ( k = 1; k <= curProp.numKeys; k++ ){ curProp.setTemporalEaseAtKey(k,[easeIn],[easeOut]); }
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