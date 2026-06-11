// WipeType Ver.1.02
// Copyright (c) 2007-2021 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2021/10/06
// テキストレイヤーにワイプイン効果を適用

var curScriptName = "WipeType";

// **** Main Script ***************************************************************************************************************
if ( app.project.activeItem != null && app.project.activeItem instanceof CompItem )
{
	var selectLayerList = new Array();
	scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedLayer.jsx" );
	
	//選択レイヤーにテキストレイヤーが含まれているかを調べる
	var flag_apply = null;
	for( i = 0; i < selectLayerList.length; i++ )
	{
		if ( selectLayerList[i] instanceof TextLayer )
		{
			var flag_apply = true; break;
		}
	}

	if ( flag_apply == true )
	{
		BuildAndShowDialog();
		if ( Btnon == "OK" )
		{
			app.beginUndoGroup( curScriptName );
			WipeType();
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
		
		swttDlg = new Window ( "dialog" , curScriptName , [0,0,288,104+addHight*5] );
		
		typePnl = swttDlg.add( "panel" , [16,16,272,52+addHight*5] , "Type" );
		
			wiRb = typePnl.add("radiobutton",[16,20+addHight*0,160,20+addHight*1],"Wipe_In"); wiRb.value = true;
			riRb = typePnl.add("radiobutton",[16,20+addHight*1,160,20+addHight*2],"Random_In");
			wioRb = typePnl.add("radiobutton",[16,20+addHight*2,160,20+addHight*3],"Wipe_In_Offset");
			rioRb = typePnl.add("radiobutton",[16,20+addHight*3,160,20+addHight*4],"Random_In_Offset");
			tiRb = typePnl.add("radiobutton",[16,20+addHight*4,160,20+addHight*5],"Type_In");
		
		cancelBtn = swttDlg.add( "button" , [70,68+addHight*5,166,88+addHight*5] , "Cancel" , {name:"cancel"} );
		okBtn = swttDlg.add( "button" , [176,68+addHight*5,272,88+addHight*5] , "OK" , {name:"ok"} );	
		
		cancelBtn.onClick = function() { Btnon = "Cancel"; swttDlg.close(); }
		okBtn.onClick = function() { Btnon = "OK"; swttDlg.close(); }
		
		swttDlg.onMove = function() { saveWindowLocation( "swttDlg", swttDlg ) }
		loadWindowLocation( "swttDlg", swttDlg );
		swttDlg.show();
}
// **** FUNCTION ******************************************************************************************************************
//		ワイプイン効果を適用
		function WipeType()
{
		curLayers = selectLayerList;
		for ( t = 0; t < curLayers.length; t++ )
		{
			if ( curLayers[t] instanceof TextLayer )
			{
				inPoint = curLayers[t].inPoint;
				FPS = activeCompFrameRate;
				
				//二重適用防止フラグ
				var flag_WipeIn = null;
				var flag_RandomIn = null;
				var flag_WipeInOffset = null;
				var flag_RandomInOffset = null;
				var flag_TypeIn1 = null;
				var flag_TypeIn2 = null;
				var curAnimList = curLayers[t].Text.property("ADBE Text Animators");
				for ( i = 1; i <= curAnimList.numProperties; i++ )
				{
					if ( curAnimList.property(i).name == "Wipe_In" ) { var flag_WipeIn = true; }
					if ( curAnimList.property(i).name == "Random_In" ) { var flag_RandomIn = true; }
					if ( curAnimList.property(i).name == "Wipe_In_Offset" ) { var flag_WipeInOffset = true; }
					if ( curAnimList.property(i).name == "Random_In_Offset" ) { var flag_RandomInOffset = true; }
					if ( curAnimList.property(i).name == "Type_In1" ) { var flag_TypeIn1 = true; }
					if ( curAnimList.property(i).name == "Type_In2" ) { var flag_TypeIn2 = true; }
				}

				if ( wiRb.value == true && flag_WipeIn != true ) { WipeIn(); }//ワイプイン
				if ( riRb.value == true && flag_RandomIn != true ) { RandomIn(); }//ランダムイン
				if ( wioRb.value == true && flag_WipeInOffset != true ) { WipeInOffset(); }//ワイプイン+オフセット
				if ( rioRb.value == true && flag_RandomInOffset != true ) { RandomInOffset(); }//ランダムイン+オフセット
				if ( tiRb.value == true && flag_TypeIn1 != true ) { TypeIn1(); }//タイピングイン
				if ( tiRb.value == true && flag_TypeIn2 != true ) { TypeIn2(); }//タイピングイン
			}
		}
}
// **** FUNCTION ******************************************************************************************************************
//		ワイプイン
		function WipeIn()
{
		var curAnim = curLayers[t].Text.Animators.addProperty("ADBE Text Animator");
		curAnim.name = "Wipe_In";

		var curSel = curAnim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
		var curProp = curSel.property("ADBE Text Percent Offset");
		curProp.setValuesAtTimes([inPoint,inPoint+12/FPS],[0,100]);
		var easeIn = new KeyframeEase(0,90);
		var easeOut = new KeyframeEase(0,64);
		for ( k = 1; k <= curProp.numKeys; k++ ){ curProp.setTemporalEaseAtKey(k,[easeIn],[easeOut]); }

		curSel.property("ADBE Text Range Advanced").property("ADBE Text Selector Smoothness").setValueAtTime( inPoint , 0 );
		
		curAnim.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue( 0 );
}
// **** FUNCTION ******************************************************************************************************************
//		ランダムイン
		function RandomIn()
{
		var curAnim = curLayers[t].Text.Animators.addProperty("ADBE Text Animator");
		curAnim.name = "Random_In";

		var curSel = curAnim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
		var curProp = curSel.property("ADBE Text Percent Offset");
		curProp.setValuesAtTimes([inPoint,inPoint+12/FPS],[0,100]);
		var easeIn = new KeyframeEase(0,90);
		var easeOut = new KeyframeEase(0,64);
		for ( k = 1; k <= curProp.numKeys; k++ ){ curProp.setTemporalEaseAtKey(k,[easeIn],[easeOut]); }

		curSel.property("ADBE Text Range Advanced").property("ADBE Text Selector Smoothness").setValueAtTime( inPoint , 100 );
		curSel.property("ADBE Text Range Advanced").property("ADBE Text Randomize Order").setValue( true );
		curSel.property("ADBE Text Range Advanced").property("ADBE Text Random Seed").setValueAtTime( inPoint , 0 );
		
		curAnim.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue( 0 );
}
// **** FUNCTION ******************************************************************************************************************
//		ワイプイン+オフセット
		function WipeInOffset()
{
		var curAnim = curLayers[t].Text.Animators.addProperty("ADBE Text Animator");
		curAnim.name = "Wipe_In_Offset";
		
		var curSel = curAnim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
		var curProp = curSel.property("ADBE Text Percent Offset");
		curProp.setValuesAtTimes([inPoint,inPoint+12/FPS],[0,100]);
		var easeIn = new KeyframeEase(0,90);
		var easeOut = new KeyframeEase(0,64);
		for ( k = 1; k <= curProp.numKeys; k++ ){ curProp.setTemporalEaseAtKey(k,[easeIn],[easeOut]); }

		curAnim.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue( 0 );
		curAnim.property("ADBE Text Animator Properties").addProperty("ADBE Text Character Offset").setValueAtTime( inPoint , 8 );
}
// **** FUNCTION ******************************************************************************************************************
//		ランダムイン+オフセット
		function RandomInOffset()
{
		var curAnim = curLayers[t].Text.Animators.addProperty("ADBE Text Animator");
		curAnim.name = "Random_In_Offset";

		var curSel = curAnim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
		var curProp = curSel.property("ADBE Text Percent Offset");
		curProp.setValuesAtTimes([inPoint,inPoint+12/FPS],[0,100]);
		var easeIn = new KeyframeEase(0,90);
		var easeOut = new KeyframeEase(0,64);
		for ( k = 1; k <= curProp.numKeys; k++ ){ curProp.setTemporalEaseAtKey(k,[easeIn],[easeOut]); }
		
		curSel.property("ADBE Text Range Advanced").property("ADBE Text Randomize Order").setValue( true );
		curSel.property("ADBE Text Range Advanced").property("ADBE Text Random Seed").setValueAtTime( inPoint , 0 );
		
		curAnim.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue( 0 );
		curAnim.property("ADBE Text Animator Properties").addProperty("ADBE Text Character Offset").setValueAtTime( inPoint , 8 );
}
// **** FUNCTION ******************************************************************************************************************
//		タイピングイン
//スペースから単語・文字数を検出して入力ラグを再現したい
//"_"の位置を返す方法が分かれば別レイヤーで点滅ブロックを追尾させる
//

		function TypeIn1()
{
		//Type_In1
		var curAnim = curLayers[t].Text.Animators.addProperty("ADBE Text Animator");
		curAnim.name = "Type_In1";

		var curSel = curAnim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
		var curProp = curSel.property("ADBE Text Percent Offset");
		var curTexDoc = curLayers[t].Text.property("ADBE Text Document").value.toString();
		//タイピングスピード毎分600文字(英数)としてエンドポイントを設定
		curProp.setValuesAtTimes([inPoint,inPoint+curTexDoc.length/600*60],[0,100]);
		//var easeIn = new KeyframeEase(0,90);
		//var easeOut = new KeyframeEase(0,64);
		//for ( k = 1; k <= curProp.numKeys; k++ ){ curProp.setTemporalEaseAtKey(k,[easeIn],[easeOut]); }
		
		var curAdv = curSel.property("ADBE Text Range Advanced");
		curAdv.property("ADBE Text Range Units").setValue( 2 );//単位をIndexにする
		curAdv.property("ADBE Text Selector Smoothness").setValue( 0 );
		
		curSel.property("ADBE Text Index Start").setValue( 1 );
		
		curAnim.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue( 0 );
}

		function TypeIn2()
{
		//Type_In2
		var curAnim = curLayers[t].Text.Animators.addProperty("ADBE Text Animator");
		curAnim.name = "Type_In2";
		
		var curSel = curAnim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
		var curAdv = curSel.property("ADBE Text Range Advanced");
		curAdv.property("ADBE Text Range Units").setValue( 2 );//単位をIndexにする
		curAdv.property("ADBE Text Selector Smoothness").setValue( 0 );
		
		curSel.property("ADBE Text Index End").setValue( 1 );
		curSel.property("ADBE Text Index Offset").expression = "text.animator(\""+"Type_In1"+"\").selector(1).offset";
		
		var curProp = curAnim.property("ADBE Text Animator Properties").addProperty("ADBE Text Character Replace");
		curProp.setValuesAtTimes([inPoint,inPoint+1/FPS,inPoint+2/FPS],[95,1,95]);//"_" = 95;
		curProp.expression = "loopOut(\""+"cycle"+"\");";
		
		var curProp = curAnim.property("ADBE Text Animator Properties").addProperty("ADBE Text Anchor Point 3D");
		curProp.addKey(inPoint);
		
		var curProp = curAnim.property("ADBE Text Animator Properties").addProperty("ADBE Text Scale 3D");
		curProp.addKey(inPoint);
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