// ============================================
// Script Name : EditCompSettings
// Version     : v5.2
// 仕様        : 複数のコンポジション設定（サイズ・尺）を同時に変換します
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-09-02
// ============================================

var curScriptName = "EditCompSettings";

var flag = null;
ProjectCheck();
if ( !flag ) CompSelectCheck();
if ( !flag )
{
	var activeItem = app.project.activeItem;
	var selectItem = app.project.selection;

	var targetCompName = null;
	var compWidth = null;
	var compHeight = null;
	var anchorPoint = null;
	var compDuration = null;
	var compFrameRate = null;
	var oneSheetDuration = 144;
	var PFflag = null;
	var AE_MAX_TIME = 10800;// AEの時間上限=3時間。これを超える outPoint / duration は代入時に例外になる
	var skipLayerList = new Array();// 上限に達して伸ばしきれなかったレイヤーの記録
	if ( typeof getItem === "undefined" ) { getItem = null; }
}
// **** Main Script ***************************************************************************************************************

		if ( !flag ) ActiveCompDetection();
		if ( !flag ) codeCollation();
		if ( !flag ) CSUMProjectFileCheck();
		if ( !flag ) {
							BuildAndShowDialog();
							getItem = null;
						}
		if ( !flag && Btnon == "OK" && selectComp.length > 1 )
		{
			//選択コンポ配列をコンポ階層順序(深い順)に並び替え
			//コンポ尺を伸ばす際、深い順に処理することでAEのusedIn自動更新を活用する
			//1コンポ選択時はソート不要のためスキップ（AdjustParentCompLayersは後段で対応）
			allCompOrderList = new Array();
			scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getCompOrder.jsx" );
			var selectCompOrderList = new Array();
			for ( var a = 0; a < allCompOrderList.length; a++ )
			{
				for ( var s = 0; s < selectComp.length; s++ )
				{
					if ( allCompOrderList[a][1].id == selectComp[s].id )
					{
						selectCompOrderList.push( selectComp[s] );
						break;
					}
				}
			}
			selectComp = selectCompOrderList;
		}
		app.beginUndoGroup(curScriptName);
		if ( !flag && Btnon == "OK" )
		{
			GetDialogSettings();
			EditCompSettings();
		}
		app.endUndoGroup();
		
// **** FUNCTION ******************************************************************************************************************
//		WorkFormatキャッシュから特定項目を取得
		function getWF ( index , category , item )
{
		if (workFormat[index] != null && typeof workFormat[index].split(category)[1].split(item)[1] !== "undefined" )
		{ return workFormat[index].split(category)[1].split(item)[1].split(TAB)[1]; }
		else
		{ return null; /*alert("指定のWorkFormatがありません");*/ }
		//getWF (0,"[FinalRenderSettings]","X");
}
// **** FUNCTION ******************************************************************************************************************
//		プロジェクトの状態チェック
		function ProjectCheck()
{	
		if ( app.project == null ) { flag = true; alert ( "プロジェクトを開いて、１つ以上のコンポジションを選択して下さい" ); }
}
// **** FUNCTION ******************************************************************************************************************
//		コンポジションの選択状態チェック
		function CompSelectCheck()
{	
		if ( app.project.activeItem == null && app.project.selection.length == 0 ) { flag = true; alert ( "１つ以上のコンポジションを選択して下さい" ); }
}
// **** FUNCTION ******************************************************************************************************************
//		CSUMプロジェクトファイルの状態チェック
		function CSUMProjectFileCheck()
{
		curWFindex = null;
		if ( app.project.file != null )
		{
			for ( i = 0; i < workFormat.length; i++ )
			{
				var titCode = getWF ( i ,"[ProjectTitleName]","codeName");
				if ( app.project.file.name.split("_")[0] == titCode )
				{ curWFindex = i ; break; }
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
//		アクティブコンポ検出
		function ActiveCompDetection()
{		
		if ( activeItem != null ) { PatternSingleActiveComp() } else { PatternMultiActiveComp() }
		if ( !flag && getItem != null )
		{
			compWidth = getItem.width;
			compHeight = getItem.height;
		}
}
// **** FUNCTION ActiveCompDetection() ********************************************************************************************
//		アクティブアイテムが１つの場合
		function PatternSingleActiveComp()
{
		if ( activeItem instanceof FolderItem )
		{
			activeItem.selected = true;
			selectItem = app.project.selection;
			PatternMultiActiveComp();
		}
		if ( activeItem instanceof CompItem )
		{	
			selectComp = new Array();
			selectComp[0] = activeItem;			
			targetCompName = selectComp[0].name;
			compWidth = selectComp[0].width;
			compHeight = selectComp[0].height;
			compDuration = selectComp[0].duration;
			compFrameRate = selectComp[0].frameRate;
		}
	
		if ( activeItem instanceof FootageItem )
		{ alert( "１つ以上のコンポジションを選択して下さい" ); flag = true; }
}
// **** FUNCTION ActiveCompDetection() ********************************************************************************************
//		アクティブアイテムが複数の場合
		function PatternMultiActiveComp()
{
					 CheckSelectItem();
		if ( !flag ) GetSelectCompSettings();
}
// **** FUNCTION ActiveCompDetection() PatternMultiActiveComp() *******************************************************************
//		アクティブアイテムが複数の場合＞コンポアイテムのみ選出
		function CheckSelectItem()
{
		for ( si = 0; si < selectItem.length; si++ )
		{
			if ( selectItem[si] instanceof FolderItem )
			{
				for ( ni = 1; ni <= app.project.numItems; ni++ )
				{
					var curItem = app.project.item(ni);
					for ( sh = 1; curItem.parentFolder.name != app.project.rootFolder.name; sh++ )
					{
						if ( curItem.parentFolder == selectItem[si] && app.project.item(ni) instanceof CompItem )
						{ app.project.item(ni).selected = true; break; }
						var curItem = curItem.parentFolder;
					}
				}
			}
		}
		selectItem = app.project.selection;
		n = selectItem.length;
		for ( i = 0; i <= n-1; i++ ) {if ( !(selectItem[i] instanceof CompItem) ) selectItem[i].selected = false }
		try { selectComp = app.project.selection; } catch(e) { alert( "１つ以上のコンポジションを選択して下さい" ); flag = true; }	
}
// **** FUNCTION ActiveCompDetection() PatternMultiActiveComp() *******************************************************************
//		選出コンポパラメーター取得
		function GetSelectCompSettings()
{
		var n = selectComp.length;
		var Wflag = null;
		var Hflag = null;
		var Dflag = null;
		for ( i = 0; i <= n-1; i++ )
		{
			//targetCompName
			var N = null; if ( n > 1 && N != true ) { targetCompName = "[multi]"; N = true; } else { targetCompName = selectComp[i].name; }
			
			//compWidth
			if ( !Wflag )
			{
				if ( i > 0 )
				{
					var beforeValue = compWidth;
					var currentValue = selectComp[i].width;
					if ( beforeValue == currentValue ) { compWidth = currentValue; } else { compWidth = "[multi]"; Wflag = true; }
				} else { compWidth = selectComp[i].width; }
			}
			//compHeight
			if ( !Hflag )
			{
				if ( i > 0 )
				{
					var beforeValue = compHeight;
					var currentValue = selectComp[i].height;
					if ( beforeValue == currentValue ) { compHeight = currentValue; } else { compHeight = "[multi]"; Hflag = true; }
				} else { compHeight = selectComp[i].height; }
			}
			//compDuration
			if ( !Dflag )
			{
				if ( i > 0 )
				{
					var beforeValue = compDuration;
					var currentValue = selectComp[i].duration;
					if ( beforeValue == currentValue ) { compDuration = currentValue; } else { compDuration = "[multi]"; Dflag = true; }
				} else { compDuration = selectComp[i].duration; }
			}
			//compFrameRate
			if ( i > 0 ) 
			{
				var beforeValue = compFrameRate;
				var currentValue = selectComp[i].frameRate;				
				if ( beforeValue == currentValue )
				{ compFrameRate = currentValue; }
				else
				{ alert ( "フレームレートが異なるコンポジションが選択されています" ); flag = true; break; }
			} else  { compFrameRate = selectComp[i].frameRate; }
		}
}
// **** FUNCTION ******************************************************************************************************************
//		作品コード照合コンポ選出
		function codeCollation()
{
		codeMatchComp = new Array();
		var n = selectComp.length;
		var m = workFormat.length;
		var p = 0;
		for ( var i = 0; i <= n-1; i++ )
		{
			var curCompCode = selectComp[i].name.split("_")[0];
			for ( var r = 0; r <= m-1; r++ )
			{
				var comparisonCode = getWF (r,"[ProjectTitleName]","codeName")
				if ( curCompCode == comparisonCode && selectComp[i].name.split("_").length >= getWF ( r ,"[TokenSettings]","RenderingCompName").split("_").length )
				{
					codeMatchComp.push(selectComp[i]);
					p++; break;
				}
			}
		}
		if ( p == 0 ) { codeMatchComp = null; }
}
// **** FUNCTION ******************************************************************************************************************
//		ダイアログ表示
		function BuildAndShowDialog()
{
		ecsDlg = new Window ( "dialog" , "Edit Comp Settings" , [0,0,448,290] );
		
		compNameCaption = ecsDlg.add( "statictext" , [16,16,180,36] , "Composition Name :" ); compNameCaption.justify="right";
		compName = ecsDlg.add( "statictext" , [190,16,432,36] , targetCompName );
		
		sizePnl = ecsDlg.add( "panel" , [16,44,432,144] , "Size" );
		
			compWidthCaption = sizePnl.add( "statictext" , [16,24,112,44] , "Width :" ); compWidthCaption.justify="right";
			compWidthEdit = sizePnl.add( "edittext" , [122,21.5,174,43.5] , compWidth ); compWidthEdit.justify="center";
			
			compHeightCaption = sizePnl.add( "statictext" , [16,54,112,74] , "Height :" ); compHeightCaption.justify="right";
			compHeightEdit = sizePnl.add( "edittext" , [122,51.5,174,73.5] , compHeight ); compHeightEdit.justify="center";
			
			compAnchorCaption = sizePnl.add( "statictext" , [190,24,268,44] , "Anchor :" ); compAnchorCaption.justify="right";
			Anchor1 = sizePnl.add( "radiobutton" , [276,68,296,88]);
			Anchor2 = sizePnl.add( "radiobutton" , [300,68,320,88]);
			Anchor3 = sizePnl.add( "radiobutton" , [324,68,344,88]);	
			Anchor4 = sizePnl.add( "radiobutton" , [276,44,296,64]);
			Anchor5 = sizePnl.add( "radiobutton" , [300,44,320,64]); Anchor5.value =true;
			Anchor6 = sizePnl.add( "radiobutton" , [324,44,344,64]);	
			Anchor7 = sizePnl.add( "radiobutton" , [276,20,296,40]);
			Anchor8 = sizePnl.add( "radiobutton" , [300,20,320,40]);
			Anchor9 = sizePnl.add( "radiobutton" , [324,20,344,40]);
			
		timePnl = ecsDlg.add( "panel" , [16,152,432,238] , "Time" );
			
			compDurationCaption1 = timePnl.add( "statictext" , [16,24,164,44] , "Duration :" ); compDurationCaption1.justify="right";
			if ( compDuration != "[multi]" ) compDuration = Math.round( compDuration*compFrameRate );
			compDurationEdit = timePnl.add( "edittext" , [174,21.5,254,43.5] , compDuration ); compDurationEdit.justify="center";
			compDurationCaption2 = timePnl.add( "statictext" , [262,24,270,44] , "f" ); compDurationCaption2.justify="left";
		
			oneSheetDurationCaption1 = timePnl.add( "statictext" , [16,54,164,74] , "1 Sheet :" ); oneSheetDurationCaption1.justify="right";
			oneSheetDurationEdit = timePnl.add( "edittext" , [174,51.5,254,73.5] , oneSheetDuration ); oneSheetDurationEdit.justify="center";
			oneSheetDurationCaption2 = timePnl.add( "statictext" , [262,54,372,74] , "f @ "+compFrameRate+" fps" ); oneSheetDurationCaption2.justify="left";
		
		codeCollationCb = ecsDlg.add( "checkbox" , [16,256,120,276] , "Code Collation" );
		if ( codeMatchComp != null ) { codeCollationCb.value = true; }
		
		cancelBtn = ecsDlg.add( "button" , [230,254,326,274] , "Cancel" , {name:"cancel"} );
		okBtn = ecsDlg.add( "button" , [336,254,432,274] , "OK" , {name:"ok"} );
		
		cancelBtn.onClick = function() { Btnon = "Cancel"; ecsDlg.close(); }
		okBtn.onClick = function() { Btnon = "OK"; ecsDlg.close(); }
		ecsDlg.onShow = function() { compDurationEdit.active = true; }
		ecsDlg.onMove = function() { saveWindowLocation( "ecsDlg", ecsDlg ) }
		loadWindowLocation( "ecsDlg", ecsDlg );
		ecsDlg.show();
}
// **** FUNCTION ******************************************************************************************************************
//		ダイアログ情報取得
		function GetDialogSettings()
{		
		//コンポ幅、高さ、アンカーポイント、１シート尺、継続時間の取得
		compWidth = compWidthEdit.text; flag = /[^0-9]/.test( compWidth );
		if ( flag == true || String(oneSheetDuration) == "NaN" || oneSheetDuration == "" ) compWidth = "[multi]";
		
		compHeight = compHeightEdit.text; flag = /[^0-9]/.test( compHeight );
		if ( flag == true || String(oneSheetDuration) == "NaN" || oneSheetDuration == "" ) compHeight = "[multi]";
		
		if ( Anchor1.value == true ) anchorPoint = [0,1];
		if ( Anchor2.value == true ) anchorPoint = [0.5,1];
		if ( Anchor3.value == true ) anchorPoint = [1,1];
		if ( Anchor4.value == true ) anchorPoint = [0,0.5];
		if ( Anchor5.value == true ) anchorPoint = [0.5,0.5];
		if ( Anchor6.value == true ) anchorPoint = [1,0.5];
		if ( Anchor7.value == true ) anchorPoint = [0,0];
		if ( Anchor8.value == true ) anchorPoint = [0.5,0];
		if ( Anchor9.value == true ) anchorPoint = [1,0];

		oneSheetDuration = oneSheetDurationEdit.text;
		flag = /[^0-9]/.test( oneSheetDuration );
		if ( flag == true || String(oneSheetDuration) == "NaN" || oneSheetDuration == "" ) oneSheetDuration = 144;
		
		codeCollation = codeCollationCb.value;

		compDuration = compDurationEdit.text;
		flag = /[^0-9]/.test( compDuration );

			if ( flag == true )
			{
				//コンポ尺に「+」と「-」が重複して含まれていた場合
				if ( /[\+]/.test( compDuration ) == true && /[\-]/.test( compDuration ) == true ) { compDuration = 1; var flag = false; }
				
				//コンポ尺に「+」が１つだけ含まれていた場合
				if ( flag == true )
				{
					var plusSplit = compDuration.split("+");
					if ( /[\+]/.test( compDuration ) == true && String(plusSplit[2]) == "undefined" )
					{
						var S = parseFloat(plusSplit[0],10); var F = parseFloat(plusSplit[1],10);
						compDuration = eval( S*compFrameRate+F ); var flag = false;
					}
				}
				
				//コンポ尺に「-」が１つだけ含まれていた場合
				if ( flag == true )
				{
					var minusSplit = compDuration.split("-");
					if ( /[\-]/.test( compDuration ) == true && String(minusSplit[2]) == "undefined" )
					{
						var S = parseFloat(minusSplit[0],10); var F = parseFloat(minusSplit[1],10);
						compDuration = eval( (S-1)*oneSheetDuration+F ); var flag = false;
					}
				}
			}
			else
			{ compDuration = parseFloat(compDuration,10); var flag = false; }
			
			//コンポ尺に数字と「+、-」以外の文字列が含まれていた場合
			if ( String(compDuration) == "NaN" || compDuration == "" || compDuration == "[multi]" ) { compDuration = "[multi]"; var flag = false; }
			if ( flag == true ) compDuration = 1;
}
// **** FUNCTION ******************************************************************************************************************
//		
		function EditCompSettings()
{
		ChangeCompSize( selectComp );
		ChangeCompDuration( selectComp );
		PreserveNestedFrameRate();
		//設定済みコンポジション選択
		var n = selectComp.length;
		for ( i = 0; i <= n-1; i++ )
		{
			selectComp[i].selected = true;
		}
		//情報パネル表示
		clearOutput();
		writeLn( "EditCompSettings Info" );
		writeLn( selectComp.length + " comps updated." );
		if ( skipLayerList.length > 0 )
		{
			var msg = "Reached the AE time limit (3:00:00). These layers could not be extended:";
			for ( var k = 0; k < skipLayerList.length; k++ ) { msg += "\n   " + skipLayerList[k]; }
			msg += "\n\nTrim them to the comp duration, then run again.";
			writeLn( "" );
			writeLn( msg );
			alert( msg );
		}
}
// **** FUNCTION EditCompSettings() ***********************************************************************************************
//		コンポサイズ変更
		function ChangeCompSize( selectComp )
{		
									if ( compWidth != "[multi]" && compHeight != "[multi]" ) { var flag = "WH"; } else { var flag = false; }
		if ( flag == false ) if ( compWidth != "[multi]" && compHeight == "[multi]" ) { var flag = "W"; }  else { var flag = false; }
		if ( flag == false ) if ( compWidth == "[multi]" && compHeight != "[multi]" ) { var flag = "H"; }  else { var flag = false; }
			
		if ( flag != false )
		{
			for ( i = 0; i <= selectComp.length-1; i++ )
			{
				SLflag = true;
				var curALshape = selectComp[i].layers.addShape();//新規シェイプレイヤー配置
				curALshape.selected = false;
				
				//アンカーポイントへ移動
				curALshape.position.setValue( [ selectComp[i].width*anchorPoint[0] , selectComp[i].height*anchorPoint[1] ] );
				
				//シェイプレイヤーと親子付け
				var ACLn = selectComp[i].numLayers;
				if ( ACLn > 1 )
				{
					for( ii = 2; ii < ACLn+1; ii++ )
					{
						var curLayer = selectComp[i].layer(ii);
						if ( curLayer.locked == true ) { curLayer.locked = false; curLayer.selected = true; } else { curLayer.selected = false; }
						if ( curLayer.parent == null ) { curLayer.parent = curALshape; }
					}
				}
				var lockedLayer = selectComp[i].selectedLayers;
				
				//コンポリサイズ
				if ( flag == "WH" )	{ selectComp[i].width = eval(compWidth); selectComp[i].height = eval(compHeight); }//Width,Height両変更
				if ( flag == "W" )	{ selectComp[i].width = eval(compWidth); }//Widthのみ変更
				if ( flag == "H" )	{ selectComp[i].height = eval(compHeight); }//Heightのみ変更
				
				//アンカーポイントへ移動
				curALshape.position.setValue( [ selectComp[i].width*anchorPoint[0] , selectComp[i].height*anchorPoint[1] ] );		
				//シェイプとの親子分離
				if ( ACLn > 1 )
				{
					for( ii = 2; ii < ACLn+1; ii++ )
					{
						var curLayer = selectComp[i].layer(ii);
						if ( curLayer.parent == selectComp[i].layer(1) ) curLayer.parent = null;
						for( L = 0; L <= lockedLayer.length-1; L++ ) { if ( lockedLayer[L] == curLayer ) curLayer.locked = true; }
					}
				}
				//シェイプ削除
				if( SLflag == true ) curALshape.remove();

				// デフォルトカメラの位置・目標点・ズームをリセット
				curComp = selectComp[i];
				scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "resetDefaultCamera.jsx" );
			}
		}
}
// **** FUNCTION EditCompSettings() ***********************************************************************************************
//		コンポ尺変更
		function ChangeCompDuration( selectComp )
{
		if ( compDuration != "[multi]" )
		{
			var n = selectComp.length;
			
			if ( codeMatchComp == null || codeCollation != true )
			//例外コンポがない場合
			{
				for ( i = 0; i <= n-1; i++ )
				{
					var curDuration = selectComp[i].duration;
					var newDuration = compDuration*selectComp[i].frameDuration;
					var curLayerList = selectComp[i].layers;
					AdjustLayerOutPoint( curDuration , newDuration , curLayerList);
					selectComp[i].duration = newDuration;
					AdjustParentCompLayers( selectComp[i] , curDuration , newDuration );
				}
			}
			else
			//例外コンポがある場合
			{
				var m = codeMatchComp.length;
				for ( i = 0; i <= n-1; i++ )
				{
					for ( r = 0; r <= m-1; r++ )
					{
						if ( selectComp[i] == codeMatchComp[r] )
						//例外コンポだった場合
						{
							var curCompCode = selectComp[i].name.split("_")[0];
							var w = workFormat.length;
							for ( q = 0; q <= w-1; q++ )
							{
								var comparisonCode = getWF ( q ,"[ProjectTitleName]","codeName");
								if ( curCompCode == comparisonCode )
								{
									curBoldDuration = eval(getWF ( q ,"[FinalRenderSettings]","boldDuration"));
									break;
								}
							}
							var curDuration = selectComp[i].duration;
							var newDuration = (compDuration+curBoldDuration)*selectComp[i].frameDuration;
							var curLayerList = selectComp[i].layers;
							AdjustLayerOutPoint( curDuration , newDuration , curLayerList);
							selectComp[i].duration = newDuration;
							AdjustParentCompLayers( selectComp[i] , curDuration , newDuration );
							break;
						}
						else
						//例外コンポでなかった場合
						{
							var curDuration = selectComp[i].duration;
							var newDuration = compDuration*selectComp[i].frameDuration;
							var curLayerList = selectComp[i].layers;
							AdjustLayerOutPoint( curDuration , newDuration , curLayerList);
							selectComp[i].duration = newDuration;
							AdjustParentCompLayers( selectComp[i] , curDuration , newDuration );
						}
					}
				}
			}
		}
}
// **** FUNCTION EditCompSettings() ChangeCompDuration()********************************************************************
//		レイヤーのアウトポイントをコンポ末尾に
//		AE時間上限(3時間)を超える outPoint 代入は例外を投げ、以降のコンポ処理ごと中断してしまうため
//		上限でクランプ＋try/catchで隔離し、対象は skipLayerList に記録して最後に報告する
		function AdjustLayerOutPoint( curDuration , newDuration , curLayerList)
{
		for ( y = 1; y <= curLayerList.length; y++ )
		{
			var curLayer = curLayerList[y];
			if ( curLayer.outPoint < curDuration ) continue;

			var targetOut = ( curLayer.outPoint > curDuration ) ? newDuration+curLayer.outPoint-curDuration : newDuration;
			var overLimit = ( targetOut > AE_MAX_TIME );
			if ( overLimit ) { targetOut = AE_MAX_TIME; RecordSkipLayer( curLayer ); }// 上限クランプ
			if ( targetOut == curLayer.outPoint ) continue;

			var wasLocked = curLayer.locked;
			if ( wasLocked ) curLayer.locked = false;
			try { curLayer.outPoint = targetOut; } catch(e) { RecordSkipLayer( curLayer ); }
			if ( wasLocked ) curLayer.locked = true;
		}
}
// **** FUNCTION EditCompSettings() ChangeCompDuration()********************************************************************
//		上限に達して伸ばしきれなかったレイヤーを記録（重複登録しない）
		function RecordSkipLayer( curLayer )
{
		var curInfo = null;
		try { curInfo = curLayer.containingComp.name + " / " + curLayer.name; } catch(e) { return; }
		for ( var k = 0; k < skipLayerList.length; k++ )
		{ if ( skipLayerList[k] == curInfo ) return; }
		skipLayerList.push( curInfo );
}
// **** FUNCTION EditCompSettings() ChangeCompDuration()********************************************************************
//		未選択の親コンポ内プリコンポレイヤーの outPoint を伸長
//		尺伸ばし時のみ実行。usedIn で直接親を取得（O(N)）
		function AdjustParentCompLayers( changedComp , oldDuration , newDuration )
{
		if ( newDuration <= oldDuration ) return;// 尺縮小・変更なしはスキップ

		var parents = changedComp.usedIn;
		for ( var p = 0; p < parents.length; p++ )
		{
			var parentComp = parents[p];

			// 選択済みコンポは AdjustLayerOutPoint + getCompOrder で処理済み → スキップ
			var isSelected = false;
			for ( var s = 0; s < selectComp.length; s++ )
			{
				if ( selectComp[s].id == parentComp.id ) { isSelected = true; break; }
			}
			if ( isSelected ) continue;

			// 親コンポ内の changedComp を参照するレイヤーの outPoint を更新
			for ( var l = 1; l <= parentComp.numLayers; l++ )
			{
				try {
					var layer = parentComp.layer(l);
					if ( layer.source == changedComp && layer.outPoint >= oldDuration )
					{
						var targetOut = ( layer.outPoint > oldDuration ) ? newDuration+layer.outPoint-oldDuration : newDuration;
						if ( targetOut > AE_MAX_TIME ) { targetOut = AE_MAX_TIME; RecordSkipLayer( layer ); }// 上限クランプ
						if ( targetOut != layer.outPoint )
						{
							var wasLocked = layer.locked;
							if ( wasLocked ) layer.locked = false;
							layer.outPoint = targetOut;
							if ( wasLocked ) layer.locked = true;
						}
					}
				} catch(e) { if ( layer != null ) RecordSkipLayer( layer ); }
			}
		}
}
// **** FUNCTION ******************************************************************************************************************
//	「コンポジション設定」ダイアログの「高度」タブの「ネスト時またはレンダーキューでフレームレートを保持」オプション設定
// 	基本全てON
// 	ただし伸縮が100%以外でコメント欄に『#pFPS』と書いてあったらOFF
		function PreserveNestedFrameRate()
{
		if ( getWF ( curWFindex ,"[EffectSettings]","PreserveFps") == "true" )
		{
			for ( i = 1; i <= app.project.numItems; i++ )
			{
				if ( app.project.item(i) instanceof CompItem ) { app.project.item(i).preserveNestedFrameRate = true; }
			}

			for ( i = 1; i <= app.project.numItems; i++ )
			{
				if ( app.project.item(i) instanceof CompItem )
				{
					for ( l = 1; l <= app.project.item(i).numLayers; l++ )
					{
						if (
							app.project.item(i).layer(l).source instanceof CompItem &&
							app.project.item(i).layer(l).stretch != 100 &&
							app.project.item(i).layer(l).comment.match(/#pFPS/igm)
						)
						{ app.project.item(i).layer(l).source.preserveNestedFrameRate = false; }
					}
				}
			}
		}
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