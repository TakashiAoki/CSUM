// CloneEffector Ver.1.04
// Copyright (c) 2007-2021 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2021/10/06
// 選択したシェイプレイヤーに水平垂直鏡像反転・回転複製オペレーターを追加します。

var curScriptName = "CloneEffector";

// **** Main Script ***************************************************************************************************************
if ( app.project.activeItem != null && app.project.activeItem instanceof CompItem )
{
	var selectLayerList = new Array();
	scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedLayer.jsx" );
	
	//選択レイヤーにシェイプレイヤーが含まれているかを調べる
	var flag_apply = null;
	for( i = 0; i < selectLayerList.length; i++ )
	{
		if ( selectLayerList[i] instanceof ShapeLayer )
		{
			var flag_apply = true; break;
		}
	}
	
	if ( flag_apply == true )
	{
		BuildAndShowDialog();//ダイアログ表示	
		if ( Btnon == "OK" )
		{
			app.beginUndoGroup( curScriptName );
			CloneEffector();//エフェクタ適用
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
		
		cfxDlg = new Window ( "dialog" , curScriptName , [0,0,288,104+addHight*5] );
		
		modePnl = cfxDlg.add( "panel" , [16,16,272,52+addHight*5] , "Mode" );
		
			mHCb = modePnl.add( "checkbox" , [16,20+addHight*0,160,20+addHight*1] , "Mirror_H" ); mHCb.value = true;
			mVCb = modePnl.add( "checkbox" , [16,20+addHight*1,160,20+addHight*2] , "Mirror_V" ); mVCb.value = true;
			cRCb = modePnl.add( "checkbox" , [16,20+addHight*2,160,20+addHight*3] , "Clone_R" );
			cHCb = modePnl.add( "checkbox" , [16,20+addHight*3,160,20+addHight*4] , "Clone_H_Symmetry" );
			cVCb = modePnl.add( "checkbox" , [16,20+addHight*4,160,20+addHight*5] , "Clone_V_Symmetry" );
		
		cancelBtn = cfxDlg.add( "button" , [70,68+addHight*5,166,88+addHight*5] , "Cancel" , {name:"cancel"} );
		okBtn = cfxDlg.add( "button" , [176,68+addHight*5,272,88+addHight*5] , "OK" , {name:"ok"} );	
		
		cancelBtn.onClick = function() { Btnon = "Cancel"; cfxDlg.close(); }
		okBtn.onClick = function() { Btnon = "OK"; cfxDlg.close(); }
		
		cfxDlg.onMove = function() { saveWindowLocation( "cfxDlg", cfxDlg ) }
		loadWindowLocation( "cfxDlg", cfxDlg );
		cfxDlg.show();
}
// **** FUNCTION ******************************************************************************************************************
//		エフェクタ適用
		function CloneEffector()
{
		for( i = 0; i < selectLayerList.length; i++ )
		{
			if ( selectLayerList[i] instanceof ShapeLayer )
			{
				CR = String.fromCharCode(13);//改行コード
				curShape = selectLayerList[i].property("ADBE Root Vectors Group");
				
				//二重適用防止フラグ
				var flag_Mirror_H = null;
				var flag_Mirror_V = null;
				var flag_Clone_R = null;
				var flag_Clone_H = null;
				var flag_Clone_V = null;
				
				for ( i = 1; i <= curShape.numProperties; i++ )
				{
					if ( curShape.property(i).name == "Mirror_H" ) { var flag_Mirror_H = true; }
					if ( curShape.property(i).name == "Mirror_V" ) { var flag_Mirror_V = true; }
					if ( curShape.property(i).name == "Clone_R" ) { var flag_Clone_R = true; }
					if ( curShape.property(i).name == "Clone_H_Symmetry" ) { var flag_Clone_H = true; }
					if ( curShape.property(i).name == "Clone_V_Symmetry" ) { var flag_Clone_V = true; }
				}
				
				if ( mHCb.value == true && flag_Mirror_H != true ){ Mirror_H(); }//水平鏡像反転
				if ( mVCb.value == true && flag_Mirror_V != true ){ Mirror_V(); }//垂直鏡像反転
				if ( cRCb.value == true && flag_Clone_R != true ){ Clone_R(); }//回転複製
				if ( cHCb.value == true && flag_Clone_H != true ){ Clone_H_Symmetry(); }//水平複製
				if ( cVCb.value == true && flag_Clone_V != true ){ Clone_V_Symmetry(); }//垂直複製
			}
		}
}
// **** FUNCTION ******************************************************************************************************************
//		水平鏡像反転
		function Mirror_H()
{
		var curRep = curShape.addProperty("ADBE Vector Filter - Repeater");
		curRep.name = "Mirror_H";
		curRep.property("ADBE Vector Repeater Copies").setValue( 2 );
		curRep.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Scale").setValue( [-100,100] );
}
// **** FUNCTION ******************************************************************************************************************
//		垂直鏡像反転
		function Mirror_V()
{
		var curRep = curShape.addProperty("ADBE Vector Filter - Repeater");
		curRep.name = "Mirror_V";
		curRep.property("ADBE Vector Repeater Copies").setValue( 2 );
		curRep.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Scale").setValue( [100,-100] );
}
// **** FUNCTION ******************************************************************************************************************
//		回転複製
		function Clone_R()
{
		var curRep = curShape.addProperty("ADBE Vector Filter - Repeater");
		curRep.name = "Clone_R";
		curRep.property("ADBE Vector Repeater Copies").setValueAtTime( 0 , 6 );
		curRep.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Rotation").expression =
		"curRep = thisProperty.propertyGroup(2).copies;"+CR+
		"if ( curRep > 0 ) { 360/curRep } else { 0 };";
}
// **** FUNCTION ******************************************************************************************************************
//		水平複製
		function Clone_H_Symmetry()
{
		var curRep = curShape.addProperty("ADBE Vector Filter - Repeater");
		curRep.name = "Clone_H_Symmetry";
		curRep.property("ADBE Vector Repeater Copies").setValueAtTime( 0 , 5 );
		curRep.property("ADBE Vector Repeater Offset").expression =
		"curRep = thisProperty.propertyGroup(1).copies;"+CR+
		"if ( curRep > 0 ) { -(curRep-1)/2 } else { 0 };";
		curRep.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValueAtTime( 0 , [100,0] );
}
// **** FUNCTION ******************************************************************************************************************
//		垂直複製
		function Clone_V_Symmetry()
{
		var curRep = curShape.addProperty("ADBE Vector Filter - Repeater");
		curRep.name = "Clone_V_Symmetry";
		curRep.property("ADBE Vector Repeater Copies").setValueAtTime( 0 , 5 );
		curRep.property("ADBE Vector Repeater Offset").expression =
		"curRep = thisProperty.propertyGroup(1).copies;"+CR+
		"if ( curRep > 0 ) { -(curRep-1)/2 } else { 0 };";
		curRep.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValueAtTime( 0 , [0,100] );
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