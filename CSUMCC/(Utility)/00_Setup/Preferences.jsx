// Preferences Ver.1.3
// Copyright (c) 2007-2018 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2016/01/11
// CSUM環境設定管理スクリプト

var curScriptName = "Preferences";

// **** Main Script ******************************************************************************************************************

		loadWfSaveDirectory( "Preferences" , "Work Format Global Save Directory" );
		//AE2026: workFormatがスタートアップ/scheduleTaskで設定済みの場合、Dropbox Smart Sync問題を回避するためリロードをスキップ
		if ( typeof workFormat === "undefined" || workFormat.length === 0 ) {
			loadWorkFormatFile( wfGlobalSaveDirectory );
		}
		//scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "logScriptExeDate.jsx" );
		BuildAndShowDialog();
		
// **** FUNCTION ******************************************************************************************************************
//		WorkFormat保存先ディレクトリ読み込み
		function loadWfSaveDirectory( scriptName , itemName )
{
		var sectionName = "CSUMCC " + scriptName;
		var sectionKey = itemName;
		
		var loadflag = app.settings.haveSetting( sectionName , sectionKey );

		if ( loadflag == true )
		{
			wfGlobalSaveDirectory = new Folder( app.settings.getSetting( sectionName , sectionKey ) );
		}
		else
		{
			wfGlobalSaveDirectory = null;
			for ( i = 0; wfGlobalSaveDirectory == null; i++ ) { wfGlobalSaveDirectory = Folder.selectDialog("WorkFormatDirectory..."); }
			var saveValue = wfGlobalSaveDirectory.fsName;
			app.settings.saveSetting( sectionName , sectionKey , saveValue );
		}
		return wfGlobalSaveDirectory;
}
// **** FUNCTION ******************************************************************************************************************
//		WorkFormat保存先ディレクトリ記憶
		function saveWfSaveDirectory( scriptName , itemName , folderObj )
{
		var sectionName = "CSUMCC " + scriptName;
		var sectionKey = itemName;
		var saveValue = folderObj.fsName;
		app.settings.saveSetting( sectionName , sectionKey , saveValue );
}
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
//		WorkFormatファイル読み込み
		function loadWorkFormatFile( targetFolder )
{
		workFormat = [];
		wokFileList = targetFolder.getFiles();
		for ( i = 0; i < wokFileList.length; i++ )
		{
			if (wokFileList[i].hidden != true && wokFileList[i].name.indexOf(".txt", 0) > -1 )//AE2026: eof除去、.txt拡張子チェック追加
			{
				wokFileList[i].open("r");
				str = wokFileList[i].read();
				
				if ( str.indexOf("//CSUMCCPreferenses") != -1 )
				{
					workFormat.push(str);
					wokFileList[i].close();
				}
				else
				{
					workFormat = [];
					wokFileList[i].close();
					break;
				}
			}
		}
		//AE2026: Dropbox Smart SyncでサーバーWFが読めない場合、ローカルキャッシュにフォールバック
		if ( workFormat.length == 0 )
		{
			// loadPreferencesがOS別に解決済みの(Cache)を使う（Mac:Scripts配下 / Win:%APPDATA%\CSUMCC配下）。
			// 旧コードは appPackage.parent 固定でWin不正＋(Cache)移動前提のため二重に誤っていた（修正）。
			var localCache = new Folder( myCSUMCCCacheFolder.fsName + "/CSUMCC_workFormat" );
			if ( localCache.exists )
			{
				var cacheFiles = localCache.getFiles();
				for ( var ci = 0; ci < cacheFiles.length; ci++ )
				{
					if ( cacheFiles[ci].hidden != true && cacheFiles[ci].name.indexOf(".jsx", 0) > -1 )
					{
						cacheFiles[ci].open("r");
						var cStr = cacheFiles[ci].read();
						if ( cStr.indexOf("//CSUMCCPreferenses") != -1 )
						{
							workFormat.push(cStr);
							cacheFiles[ci].close();
						}
						else
						{
							workFormat = [];
							cacheFiles[ci].close();
							break;
						}
					}
				}
			}
		}
		if (workFormat.length == 0 ){alert("WorkFormatファイルが正しく読み込まれませんでした。適切なフォルダを選択して下さい。");}
		return workFormat;
}
// **** FUNCTION ******************************************************************************************************************
//		システムのカラーピックを利用して色を取得
			function colorPick( getRGBA )
		{
			if ( typeof getRGBA === "undefined" ) { getRGBA = [0.25,0.25,0.25,1]; }
			var getHexRGB = convertToHexRGB( getRGBA );
			var picCol = $.colorPicker( getHexRGB );
			return getRGBA = convertToRGB( picCol );
		}
// **** FUNCTION ******************************************************************************************************************
//		色空間を[1,0,0,1]から[0xFF0000](16進数)に変換
			function convertToHexRGB( getRGBA )
		{
			var hexR = (getRGBA[0]*255).toString(16);
			if ( hexR.length == 1 ) hexR = "0" + hexR;
			var hexG = (getRGBA[1]*255).toString(16);
			if ( hexG.length == 1 ) hexG = "0" + hexG;
			var hexB = (getRGBA[2]*255).toString(16);
			if ( hexB.length == 1 ) hexB= "0" + hexB;
			return getHexRGB = "0x" + hexR + hexG + hexB;
		}
// **** FUNCTION ******************************************************************************************************************
//		色空間を[0xFF0000](16進数)から[1,0,0,1]に変換
			function convertToRGB( getHexRGB )
		{
			var curCol = [ getHexRGB >> 16 , ( getHexRGB & 0x00ff00 ) >> 8 , getHexRGB & 0xff ];
			var RGBA = [,,,1];
			for ( var i = 0; i < 3; i++ ) { RGBA[i] = 1/255*Math.round(curCol[i]); }
			return getRGBA = RGBA;
		}
// **** FUNCTION ******************************************************************************************************************
//		ダイアログ表示
		function BuildAndShowDialog()
{
		cprDlgSize = [1016,866];//ダイアログサイズ
		
		var CpXs = 16;//statictextスペース幅
		var CpXb = 8;//statictext本体幅
		var CpYs = 16;//statictextスペース高さ
		var CpYb = 16;//statictext本体高さ
		
		var EdXs = 16;//edittextスペース幅
		var EdXb = 8;//edittext本体幅
		var EdYs = 14;//edittextスペース高さ
		var EdYb = 20;//edittext本体高さ

		var fpsList = ["---",8,12,15,23.976,24,25,29.97,30,50,59.94,60];
		
		Btnon = null;
		changeUI = null;
	
		var cprDlg = new Window("dialog","CSUMCC Preferences");
		//cprDlg.preferredSize = cprDlgSize;
		cprDlg.orientation = "column";
		cprDlg.spacing = 16;
		cprDlg.margins = 16;

		var cprTpl = cprDlg.add("tabbedpanel",undefined);//Rootカテゴリー分けTabパネル
		
			//var genTab = cprTpl.add("tab",undefined,"General");
			var wokTab = cprTpl.add("tab",undefined,"Works");
			//var notTab = cprTpl.add("tab",undefined,"Notes");


		//GeneralTab **********
		//var genListbox = genTab.add("listbox",[CpXs,CpYs,CpXs+180,764-10],["StartSetUp4","FitFootage","item1","item1","item1","item1","item1"]);
		//genListbox.preferredSize = [180,738];
		//genListbox.alignment = ["left","top"];


		//WorksTab **********
		
			//Work Format Save Directory
			var objHeight = EdYb*3;

			var wfsdPnl = wokTab.add("panel", [CpXs,CpYs,971-CpXs+8,CpYs+objHeight],"Work Format Files");
			wfsdPnl.preferredSize = [947,60];
			wfsdPnl.orientation = "row";
			wfsdPnl.alignment = ["fill","top"];
			wfsdPnl.spacing = 8;
			wfsdPnl.margins = 8;
				addY = CpYb*0;
				var wfsdCaption = wfsdPnl.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "Save Directory : " ); wfsdCaption.justify="right";
				var wfsdEdit = wfsdPnl.add( "statictext" , [wfsdCaption.bounds[2]+EdXs,EdYs+addY ,wfsdCaption.bounds[2]+EdXs+EdXb*80,EdYs+EdYb+addY ] , wfGlobalSaveDirectory.fsName ); wfsdEdit.justify="left";
				var wfsdBtn = wfsdPnl.add( "button" , undefined , "Choose..." );
				wfsdBtn.preferredSize = [96,20];
				wfsdBtn.alignment = ["right","center"];

				wfsdBtn.onClick = function()
				{
					var curFolderObj = new Folder(wfsdEdit.text);
					var newFolderObj = curFolderObj.selectDlg("Work Format Files to...");
					if ( newFolderObj != null )
					{						
						Btnon = "wfsdBtn";
						changeUI = null;
						loadWorkFormatFile( newFolderObj );
						wfGlobalSaveDirectory = newFolderObj;
						wfsdEdit.text = wfGlobalSaveDirectory.fsName;
						saveWfSaveDirectory( "Preferences" , "Work Format Global Save Directory" , wfGlobalSaveDirectory );
						if ( workFormat.length != 0 )
						{
							showWorkFormatUI();
							loadWorkFormatCacheToListBox();
							wokListbox.selection = wokListbox.items[0];
							loadWorkFormatCacheToUI(0);
							changeUI = null;
						}
						else
						{
							hideWorkFormatUI();
						}
					}
				}
			
			//グループ作成
			var spacing = 8;
			var margins = 8;
			
			wokTabGrpObj = wokTab.add("group");
			wokTabGrpObj.orientation = "row";
			wokTabGrpObj.alignment = ["fill","fill"];
			wokTabGrpObj.alignChildren = ["fill","top"];
			
			wokTabGrpObj_L = wokTabGrpObj.add("group");
			wokTabGrpObj_L.orientation = "column";
			wokTabGrpObj_L.alignment = ["fill","fill"];
			wokTabGrpObj_L.spacing = spacing;
			wokTabGrpObj_L.margins = margins;
			
			wokTabGrpObj_L1 = wokTabGrpObj_L.add("group");
			wokTabGrpObj_L2 = wokTabGrpObj_L.add("group");
			wokTabGrpObj_L3 = wokTabGrpObj_L.add("group");
			
			wokTabGrpObj_C = wokTabGrpObj.add("group");
			wokTabGrpObj_C.orientation = "column";
			wokTabGrpObj_C.alignment = ["fill","fill"];
			wokTabGrpObj_C.spacing = spacing;
			wokTabGrpObj_C.margins = margins;
			
			wokTabGrpObj_R = wokTabGrpObj.add("group");
			wokTabGrpObj_R.orientation = "column";
			wokTabGrpObj_R.alignment = ["fill","fill"];
			wokTabGrpObj_R.alignChildren = ["right","bottom"];
			wokTabGrpObj_R.spacing = spacing;
			wokTabGrpObj_R.margins = margins;
			
			//Work Format ListBox
			wokListbox = wokTabGrpObj_L1.add("listbox",[CpXs,wfsdPnl.bounds[3]+CpYs,CpXs+200,764-10-EdYb-EdYs-EdYb-EdYs]);//WFリスト
			wokListbox.preferredSize = [180,594];
			wokListbox.alignment = ["left","top"];
			var wokPanelXstart = CpXs+wokListbox.preferredSize[0]+CpXs;//パネルの左端位置
			var wokPanelXend = 971-CpXs-88-CpXs;//パネルの右端位置
			
			//最終更新日時表示
			var objHeight = CpYb*1;
			lastUpdateCaption = wokTabGrpObj_C.add( "statictext" ); lastUpdateCaption.justify="right";
			lastUpdateCaption.alignment = ["right","top"];
			
			//作品名称パネル
			var objHeight = CpYb*5;
			
			titleSetPnl = wokTabGrpObj_C.add("panel", undefined ,"Project Name");
			titleSetPnl.orientation = "row";
			titleSetPnl.alignment = ["fill","center"];
			
			titleSetPnlGrpObj_L = titleSetPnl.add("group");
			titleSetPnlGrpObj_L.orientation = "column";
			titleSetPnlGrpObj_L.alignment = ["left","center"];
			
			titleSetPnlGrpObj_L1 = titleSetPnlGrpObj_L.add("group");
			titleSetPnlGrpObj_L1.alignment = ["left","center"];
			
			titleSetPnlGrpObj_L2 = titleSetPnlGrpObj_L.add("group");
			titleSetPnlGrpObj_L2.alignment = ["left","center"];
			
			titleSetPnlGrpObj_R = titleSetPnl.add("group");
			titleSetPnlGrpObj_R.orientation = "stack";
			titleSetPnlGrpObj_R.alignment = ["right","center"];
			
				//作品略称
				addY = CpYb*0;
				var titCodeCaption = titleSetPnlGrpObj_L1.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "Title Code: " ); titCodeCaption.justify="right";
				titCodeEdit = titleSetPnlGrpObj_L1.add( "edittext" , [titCodeCaption.bounds[2]+EdXs,EdYs+addY ,titCodeCaption.bounds[2]+EdXs+EdXb*8,EdYs+EdYb+addY ] ); titCodeEdit.justify="right";

				//作品名称
				addY = CpYb*2;
				var titNameCaption = titleSetPnlGrpObj_L2.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "Title Name: " ); titNameCaption.justify="right";
				titNameEdit = titleSetPnlGrpObj_L2.add( "edittext" , [titNameCaption.bounds[2]+EdXs,EdYs+addY ,titNameCaption.bounds[2]+EdXs+EdXb*24,EdYs+EdYb+addY ] ); titNameEdit.justify="right";
				
				//作品カラー
				var projColGrpBack = titleSetPnlGrpObj_R.add("group");
				projColGrpBack.preferredSize = [50,50];
				var projColGrpBackUI = projColGrpBack.graphics;
				var uiBrush = projColGrpBackUI.newBrush(projColGrpBackUI.BrushType.SOLID_COLOR, [0,0,0,1]);
				projColGrpBackUI.backgroundColor = uiBrush;
				
				projColGrpFront = titleSetPnlGrpObj_R.add("group");
				projColGrpFront.preferredSize = [48,48];
				projColGrpFrontUI = projColGrpFront.graphics;

				projColGrpFront.addEventListener( 'mousedown' , projColGrpFrontMdFunc );
		

			//WFカテゴリー分けTabパネル
			var objHeight = CpYb*33+6;
			renderSetTpl = wokTabGrpObj_C.add("tabbedpanel");
			renderSetTplSize = [639,534+8];
			renderSetTpl.preferredSize = renderSetTplSize;
			
				finSetTab = renderSetTpl.add("tab",[0,0,0,0],"Final Render Settings");
				timSetTab = renderSetTpl.add("tab",[0,0,0,0],"Timing Render Settings");
				saveSetTab = renderSetTpl.add("tab",[0,0,0,0],"Save Settings");
				fxSetTab = renderSetTpl.add("tab",[0,0,0,0],"Effect");
				tokSetTab = renderSetTpl.add("tab",[0,0,0,0],"Token");

				//Final Render Settings ***********************************************************
				
				finSetTabGrpObj_A = finSetTab.add("group");
				finSetTabGrpObj_A.orientation = "column";
				finSetTabGrpObj_A.alignment = ["fill","top"];
				finSetTabGrpObj_A.spacing = spacing;
				finSetTabGrpObj_A.margins = margins;
				
				finSetTabGrpObj_A1 = finSetTabGrpObj_A.add("group");
				finSetTabGrpObj_A1.alignment = ["left","top"];
				
				finSetTabGrpObj_A2 = finSetTabGrpObj_A.add("group");
				finSetTabGrpObj_A2.alignment = ["left","top"];
				
				finSetTabGrpObj_A3 = finSetTabGrpObj_A.add("group");
				finSetTabGrpObj_A3.alignment = ["left","top"];
				
				finSetTabGrpObj_A4 = finSetTabGrpObj_A.add("group");
				finSetTabGrpObj_A4.alignment = ["left","top"];
				
				//Fin サイズ
				addY = CpYb*0;
				var finSizeXYCaption = finSetTabGrpObj_A1.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "Render Size (pixel) : " ); finSizeXYCaption.justify="right";
				finSizeXEdit = finSetTabGrpObj_A1.add( "edittext" , [finSizeXYCaption.bounds[2]+EdXs,EdYs+addY ,finSizeXYCaption.bounds[2]+EdXs+EdXb*8,EdYs+EdYb+addY ] ); finSizeXEdit.justify="right";
				var finSizeXYCaption2 = finSetTabGrpObj_A1.add( "statictext" , [finSizeXEdit.bounds[2],CpYs+addY ,finSizeXEdit.bounds[2]+CpXb+CpXb*2,CpYs+CpYb+addY ] , " x " ); finSizeXYCaption2.justify="center";
				finSizeYEdit = finSetTabGrpObj_A1.add( "edittext" , [finSizeXYCaption2.bounds[2],EdYs+addY ,finSizeXYCaption2.bounds[2]+EdXs+EdXb*8,EdYs+EdYb+addY ] ); finSizeYEdit.justify="right";
		
				//Fin FPS
				addY = CpYb*2;
				var finFpsCaption = finSetTabGrpObj_A2.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY] , "FPS : " ); finFpsCaption.justify="right";
				finFpsDDlist = finSetTabGrpObj_A2.add( "dropdownlist" , [finSizeXYCaption.bounds[2]+EdXs,EdYs+addY ,finSizeXYCaption.bounds[2]+EdXs+EdXb*10,EdYs+EdYb+addY ] , fpsList);

				//Fin Bold Duration
				addY = CpYb*4;
				var finBolDurCaption = finSetTabGrpObj_A3.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY] , "Bold Duration : " ); finBolDurCaption.justify="right";
				finBolDurEdit = finSetTabGrpObj_A3.add( "edittext" , [finSizeXYCaption.bounds[2]+EdXs,EdYs+addY ,finSizeXYCaption.bounds[2]+EdXs+EdXb*8,EdYs+EdYb+addY ] ); finBolDurEdit.justify="right";

				//Fin Codec
				addY = CpYb*6;
				var finQtCodecCaption = finSetTabGrpObj_A4.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "QuickTime Codec : " ); finQtCodecCaption.justify="right";
				finQtCodecEdit = finSetTabGrpObj_A4.add( "edittext" , [finSizeXYCaption.bounds[2]+EdXs,EdYs+addY ,finSizeXYCaption.bounds[2]+EdXs+EdXb*16,EdYs+EdYb+addY ] ); finQtCodecEdit.justify="right";

				//Fin Sequence Render
				addY = CpYb*8;
				var objHeight = CpYb*6;
				var finSeqRenPnl = finSetTab.add("panel", [CpXs,CpYs+addY ,renderSetTplSize[0]-CpXs-5,CpYs+addY +objHeight],"Sequence Render");
				
				finSeqRenPnlGrpObj_B = finSeqRenPnl.add("group");
				finSeqRenPnlGrpObj_B.orientation = "column";
				finSeqRenPnlGrpObj_B.alignment = ["fill","top"];
				finSeqRenPnlGrpObj_B.spacing = spacing;
				finSeqRenPnlGrpObj_B.margins = margins;
				
				finSeqRenPnlGrpObj_B1 = finSeqRenPnlGrpObj_B.add("group");
				finSeqRenPnlGrpObj_B1.alignment = ["left","top"];
				
				finSeqRenPnlGrpObj_B2 = finSeqRenPnlGrpObj_B.add("group");
				finSeqRenPnlGrpObj_B2.alignment = ["left","top"];
				
					//Seq:RenderSettings
					addY = CpYb*0;
					var finSeqRenSetCaption = finSeqRenPnlGrpObj_B1.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "RenderSettings : " ); finSeqRenSetCaption.justify="right";
					finSeqRenSetDDlist = finSeqRenPnlGrpObj_B1.add( "dropdownlist" , [finSeqRenSetCaption.bounds[2]+EdXs,EdYs+addY ,finSeqRenSetCaption.bounds[2]+EdXs+EdXb*24,EdYs+EdYb+addY ] , wfRsTempList);
					//Seq:OutputModule
					addY = CpYb*2;
					var finSeqOutMdlCaption = finSeqRenPnlGrpObj_B2.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "OutputModule : " ); finSeqOutMdlCaption.justify="right";
					finSeqOutMdlDDlist = finSeqRenPnlGrpObj_B2.add( "dropdownlist" , [finSeqRenSetCaption.bounds[2]+EdXs,EdYs+addY ,finSeqRenSetCaption.bounds[2]+EdXs+EdXb*24,EdYs+EdYb+addY ] , wfOmTempList );

				//Fin Movie Render
				addY = CpYb*15;
				var objHeight = CpYb*6;
				var finMovRenPnl = finSetTab.add("panel", [CpXs,CpYs+addY ,renderSetTplSize[0]-CpXs-5,CpYs+addY +objHeight],"Movie Render");
				
				finSeqRenPnlGrpObj_C = finMovRenPnl.add("group");
				finSeqRenPnlGrpObj_C.orientation = "column";
				finSeqRenPnlGrpObj_C.alignment = ["fill","top"];
				finSeqRenPnlGrpObj_C.spacing = spacing;
				finSeqRenPnlGrpObj_C.margins = margins;
				
				finSeqRenPnlGrpObj_C1 = finSeqRenPnlGrpObj_C.add("group");
				finSeqRenPnlGrpObj_C1.alignment = ["left","top"];
				
				finSeqRenPnlGrpObj_C2 = finSeqRenPnlGrpObj_C.add("group");
				finSeqRenPnlGrpObj_C2.alignment = ["left","top"];
				
					//Mov:RenderSettings
					addY = CpYb*0;
					var finMovRenSetCaption = finSeqRenPnlGrpObj_C1.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "RenderSettings : " ); finMovRenSetCaption.justify="right";
					finMovRenSetDDlist = finSeqRenPnlGrpObj_C1.add( "dropdownlist" , [finMovRenSetCaption.bounds[2]+EdXs,EdYs+addY ,finMovRenSetCaption.bounds[2]+EdXs+EdXb*24,EdYs+EdYb+addY ] , wfRsTempList);				
					//Mov:OutputModule
					addY = CpYb*2;
					var finMovOutMdlCaption = finSeqRenPnlGrpObj_C2.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "OutputModule : " ); finMovOutMdlCaption.justify="right";
					finMovOutMdlDDlist = finSeqRenPnlGrpObj_C2.add( "dropdownlist" , [finMovRenSetCaption.bounds[2]+EdXs,EdYs+addY ,finMovRenSetCaption.bounds[2]+EdXs+EdXb*24,EdYs+EdYb+addY ] , wfOmTempList );
			
				//Fin Check Movie Render
				addY = CpYb*22;
				var objHeight = CpYb*8;
				var finChkMovRenPnl = finSetTab.add("panel", [CpXs,CpYs+addY ,renderSetTplSize[0]-CpXs-5,CpYs+addY +objHeight],"Check Movie Render");

				finChkMovRenPnlGrpObj_D = finChkMovRenPnl.add("group");
				finChkMovRenPnlGrpObj_D.orientation = "column";
				finChkMovRenPnlGrpObj_D.alignment = ["fill","top"];
				finChkMovRenPnlGrpObj_D.spacing = spacing;
				finChkMovRenPnlGrpObj_D.margins = margins;
				
				finChkMovRenPnlGrpObj_D1 = finChkMovRenPnlGrpObj_D.add("group");
				finChkMovRenPnlGrpObj_D1.alignment = ["left","top"];
				
				finChkMovRenPnlGrpObj_D2 = finChkMovRenPnlGrpObj_D.add("group");
				finChkMovRenPnlGrpObj_D2.alignment = ["left","top"];
				
				finChkMovRenPnlGrpObj_D3 = finChkMovRenPnlGrpObj_D.add("group");
				finChkMovRenPnlGrpObj_D3.alignment = ["left","top"];
				
					//ChkMov:RenderSettings
					addY = CpYb*0;
					var finChkMovRenSetCaption = finChkMovRenPnlGrpObj_D1.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "RenderSettings : " ); finChkMovRenSetCaption.justify="right";
					finChkMovRenSetDDlist = finChkMovRenPnlGrpObj_D1.add( "dropdownlist" , [finChkMovRenSetCaption.bounds[2]+EdXs,EdYs+addY ,finChkMovRenSetCaption.bounds[2]+EdXs+EdXb*24,EdYs+EdYb+addY ] , wfRsTempList);	
					//ChkMov:OutputModule
					addY = CpYb*2;
					var finChkMovOutMdlCaption = finChkMovRenPnlGrpObj_D2.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "OutputModule : " ); finChkMovOutMdlCaption.justify="right";
					finChkMovOutMdlDDlist = finChkMovRenPnlGrpObj_D2.add( "dropdownlist" , [finChkMovRenSetCaption.bounds[2]+EdXs,EdYs+addY ,finChkMovRenSetCaption.bounds[2]+EdXs+EdXb*24,EdYs+EdYb+addY ] , wfOmTempList );
					//ChkMov:FPS
					addY = CpYb*4;
					var finChkMovFpsCaption = finChkMovRenPnlGrpObj_D3.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY] , "FPS : " ); finChkMovFpsCaption.justify="right";
					finChkMovFpsDDlist = finChkMovRenPnlGrpObj_D3.add( "dropdownlist" , [finSizeXYCaption.bounds[2]+EdXs,EdYs+addY ,finSizeXYCaption.bounds[2]+EdXs+EdXb*10,EdYs+EdYb+addY ] , fpsList);
			
				//Timing Render Settings ***********************************************************
				
				timSetTabGrpObj_A = timSetTab.add("group");
				timSetTabGrpObj_A.orientation = "column";
				timSetTabGrpObj_A.alignment = ["fill","top"];
				timSetTabGrpObj_A.spacing = spacing;
				timSetTabGrpObj_A.margins = margins;
				
				timSetTabGrpObj_A1 = timSetTabGrpObj_A.add("group");
				timSetTabGrpObj_A1.alignment = ["left","top"];
				
				timSetTabGrpObj_A2 = timSetTabGrpObj_A.add("group");
				timSetTabGrpObj_A2.alignment = ["left","top"];
				
				timSetTabGrpObj_A3 = timSetTabGrpObj_A.add("group");
				timSetTabGrpObj_A3.alignment = ["left","top"];
				
				timSetTabGrpObj_A4 = timSetTabGrpObj_A.add("group");
				timSetTabGrpObj_A4.alignment = ["left","top"];
				
				//Tim サイズ
				addY = CpYb*0;
				var timSizeXYCaption = timSetTabGrpObj_A1.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "Render Size (pixel) : " ); timSizeXYCaption.justify="right";
				timSizeXEdit = timSetTabGrpObj_A1.add( "edittext" , [timSizeXYCaption.bounds[2]+EdXs,EdYs+addY ,timSizeXYCaption.bounds[2]+EdXs+EdXb*8,EdYs+EdYb+addY ] ); timSizeXEdit.justify="right";
				var timSizeXYCaption2 = timSetTabGrpObj_A1.add( "statictext" , [timSizeXEdit.bounds[2],CpYs+addY ,timSizeXEdit.bounds[2]+CpXb+CpXb*2,CpYs+CpYb+addY ] , " x " ); timSizeXYCaption2.justify="center";
				timSizeYEdit = timSetTabGrpObj_A1.add( "edittext" , [timSizeXYCaption2.bounds[2],EdYs+addY ,timSizeXYCaption2.bounds[2]+EdXs+EdXb*8,EdYs+EdYb+addY ] ); timSizeYEdit.justify="right";

				//Tim FPS
				addY = CpYb*2;
				var timFpsCaption = timSetTabGrpObj_A2.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY] , "FPS : " ); timFpsCaption.justify="right";
				timFpsDDlist = timSetTabGrpObj_A2.add( "dropdownlist" , [timSizeXYCaption.bounds[2]+EdXs,EdYs+addY ,timSizeXYCaption.bounds[2]+EdXs+EdXb*10,EdYs+EdYb+addY ] , fpsList);
			
				//Tim Bold Duration
				addY = CpYb*4;
				var timBolDurCaption = timSetTabGrpObj_A3.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY] , "Bold Duration : " ); timBolDurCaption.justify="right";
				timBolDurEdit = timSetTabGrpObj_A3.add( "edittext" , [timSizeXYCaption.bounds[2]+EdXs,EdYs+addY ,timSizeXYCaption.bounds[2]+EdXs+EdXb*8,EdYs+EdYb+addY ] ); timBolDurEdit.justify="right";

				//Tim Codec
				addY = CpYb*6;
				var timQtCodecCaption = timSetTabGrpObj_A4.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "QuickTime Codec : " ); timQtCodecCaption.justify="right";
				timQtCodecEdit = timSetTabGrpObj_A4.add( "edittext" , [timSizeXYCaption.bounds[2]+EdXs,EdYs+addY ,timSizeXYCaption.bounds[2]+EdXs+EdXb*16,EdYs+EdYb+addY ] ); timQtCodecEdit.justify="right";

				//Tim Sequence Render
				addY = CpYb*8;
				var objHeight = CpYb*6;
				var timSeqRenPnl = timSetTab.add("panel", [CpXs,CpYs+addY ,renderSetTplSize[0]-CpXs-5,CpYs+addY +objHeight],"Sequence Render");
				
				timSeqRenPnlGrpObj_B = timSeqRenPnl.add("group");
				timSeqRenPnlGrpObj_B.orientation = "column";
				timSeqRenPnlGrpObj_B.alignment = ["fill","top"];
				timSeqRenPnlGrpObj_B.spacing = spacing;
				timSeqRenPnlGrpObj_B.margins = margins;
				
				timSeqRenPnlGrpObj_B1 = timSeqRenPnlGrpObj_B.add("group");
				timSeqRenPnlGrpObj_B1.alignment = ["left","top"];
				
				timSeqRenPnlGrpObj_B2 = timSeqRenPnlGrpObj_B.add("group");
				timSeqRenPnlGrpObj_B2.alignment = ["left","top"];
				
					//Seq:RenderSettings
					addY = CpYb*0;
					var timSeqRenSetCaption = timSeqRenPnlGrpObj_B1.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "RenderSettings : " ); timSeqRenSetCaption.justify="right";
					timSeqRenSetDDlist = timSeqRenPnlGrpObj_B1.add( "dropdownlist" , [timSeqRenSetCaption.bounds[2]+EdXs,EdYs+addY ,timSeqRenSetCaption.bounds[2]+EdXs+EdXb*24,EdYs+EdYb+addY ] , wfRsTempList);
					
					//Seq:OutputModule
					addY = CpYb*2;
					var timSeqOutMdlCaption = timSeqRenPnlGrpObj_B2.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "OutputModule : " ); timSeqOutMdlCaption.justify="right";
					timSeqOutMdlDDlist = timSeqRenPnlGrpObj_B2.add( "dropdownlist" , [timSeqRenSetCaption.bounds[2]+EdXs,EdYs+addY ,timSeqRenSetCaption.bounds[2]+EdXs+EdXb*24,EdYs+EdYb+addY ] , wfOmTempList );

				//Tim Movie Render
				addY = CpYb*15;
				var objHeight = CpYb*6;
				var timMovRenPnl = timSetTab.add("panel", [CpXs,CpYs+addY ,renderSetTplSize[0]-CpXs-5,CpYs+addY +objHeight],"Movie Render");
				
				timSeqRenPnlGrpObj_C = timMovRenPnl.add("group");
				timSeqRenPnlGrpObj_C.orientation = "column";
				timSeqRenPnlGrpObj_C.alignment = ["fill","top"];
				timSeqRenPnlGrpObj_C.spacing = spacing;
				timSeqRenPnlGrpObj_C.margins = margins;
				
				timSeqRenPnlGrpObj_C1 = timSeqRenPnlGrpObj_C.add("group");
				timSeqRenPnlGrpObj_C1.alignment = ["left","top"];
				
				timSeqRenPnlGrpObj_C2 = timSeqRenPnlGrpObj_C.add("group");
				timSeqRenPnlGrpObj_C2.alignment = ["left","top"];
				
					//Mov:RenderSettings
					addY = CpYb*0;
					var timMovRenSetCaption = timSeqRenPnlGrpObj_C1.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "RenderSettings : " ); timMovRenSetCaption.justify="right";
					timMovRenSetDDlist = timSeqRenPnlGrpObj_C1.add( "dropdownlist" , [timMovRenSetCaption.bounds[2]+EdXs,EdYs+addY ,timMovRenSetCaption.bounds[2]+EdXs+EdXb*24,EdYs+EdYb+addY ] , wfRsTempList);
					
					//Mov:OutputModule
					addY = CpYb*2;
					var timMovOutMdlCaption = timSeqRenPnlGrpObj_C2.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "OutputModule : " ); timMovOutMdlCaption.justify="right";
					timMovOutMdlDDlist = timSeqRenPnlGrpObj_C2.add( "dropdownlist" , [timMovRenSetCaption.bounds[2]+EdXs,EdYs+addY ,timMovRenSetCaption.bounds[2]+EdXs+EdXb*24,EdYs+EdYb+addY ] , wfOmTempList );
					
				//Tim Check Movie Render
				addY = CpYb*22;
				var objHeight = CpYb*8;
				var timChkMovRenPnl = timSetTab.add("panel", [CpXs,CpYs+addY ,renderSetTplSize[0]-CpXs-5,CpYs+addY +objHeight],"Check Movie Render");
				
				timChkMovRenPnlGrpObj_D = timChkMovRenPnl.add("group");
				timChkMovRenPnlGrpObj_D.orientation = "column";
				timChkMovRenPnlGrpObj_D.alignment = ["fill","top"];
				timChkMovRenPnlGrpObj_D.spacing = spacing;
				timChkMovRenPnlGrpObj_D.margins = margins;
				
				timChkMovRenPnlGrpObj_D1 = timChkMovRenPnlGrpObj_D.add("group");
				timChkMovRenPnlGrpObj_D1.alignment = ["left","top"];
				
				timChkMovRenPnlGrpObj_D2 = timChkMovRenPnlGrpObj_D.add("group");
				timChkMovRenPnlGrpObj_D2.alignment = ["left","top"];
				
				timChkMovRenPnlGrpObj_D3 = timChkMovRenPnlGrpObj_D.add("group");
				timChkMovRenPnlGrpObj_D3.alignment = ["left","top"];
				
					//ChkMov:RenderSettings
					addY = CpYb*0;
					var timChkMovRenSetCaption = timChkMovRenPnlGrpObj_D1.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "RenderSettings : " ); timChkMovRenSetCaption.justify="right";
					timChkMovRenSetDDlist = timChkMovRenPnlGrpObj_D1.add( "dropdownlist" , [timChkMovRenSetCaption.bounds[2]+EdXs,EdYs+addY ,timChkMovRenSetCaption.bounds[2]+EdXs+EdXb*24,EdYs+EdYb+addY ] , wfRsTempList);
				
					//ChkMov:OutputModule
					addY = CpYb*2;
					var timChkMovOutMdlCaption = timChkMovRenPnlGrpObj_D2.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "OutputModule : " ); timChkMovOutMdlCaption.justify="right";
					timChkMovOutMdlDDlist = timChkMovRenPnlGrpObj_D2.add( "dropdownlist" , [timChkMovRenSetCaption.bounds[2]+EdXs,EdYs+addY ,timChkMovRenSetCaption.bounds[2]+EdXs+EdXb*24,EdYs+EdYb+addY ] , wfOmTempList );
				
					//ChkMov:FPS
					addY = CpYb*4;
					var timChkMovFpsCaption = timChkMovRenPnlGrpObj_D3.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY] , "FPS : " ); timChkMovFpsCaption.justify="right";
					timChkMovFpsDDlist = timChkMovRenPnlGrpObj_D3.add( "dropdownlist" , [timSizeXYCaption.bounds[2]+EdXs,EdYs+addY ,timSizeXYCaption.bounds[2]+EdXs+EdXb*10,EdYs+EdYb+addY ] , fpsList);

				//Save Settings ***********************************************************
					//ムービー保存フォルダ
					addY = CpYb*0;
					
					saveSetTabGrpObj_A = saveSetTab.add("group");
					saveSetTabGrpObj_A.orientation = "column";
					saveSetTabGrpObj_A.alignment = ["left","top"];
					saveSetTabGrpObj_A.spacing = spacing;
					saveSetTabGrpObj_A.margins = margins;
					
					saveSetTabGrpObj_A1 = saveSetTabGrpObj_A.add("group");
					saveSetTabGrpObj_A1.orientation = "row";
					saveSetTabGrpObj_A1.alignment = ["left","top"];

					var ssMovExFolderCaption = saveSetTabGrpObj_A1.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "MovExFolder : " ); ssMovExFolderCaption.justify="right";
					var ssMovExFolderBtn = saveSetTabGrpObj_A1.add( "button" , [ssMovExFolderCaption.bounds[2]+EdXs,EdYs+addY,ssMovExFolderCaption.bounds[2]+EdXs+80,EdYs+EdYb+addY ] , "Choose..." );
					addY = CpYb*2;
					ssMovExFolderEdit = saveSetTabGrpObj_A1.add( "statictext" ); ssMovExFolderEdit.justify="left";
					ssMovExFolderEdit.preferredSize = [466,16];
					ssMovExFolderBtn.onClick = function()
					{
						var curFolderObj = new Folder(ssMovExFolderEdit.text);
						ssMovExFolderDirectory = curFolderObj.selectDlg("Output to...");
						if ( ssMovExFolderDirectory != null )
						{
							changeUI = true;
							ssMovExFolderEdit.text = ssMovExFolderDirectory.fsName;						
							workFormat[wokListbox.selection.index] = getCurWorkFormatUISettings();
							var titCode = getWF (wokListbox.selection.index,"[ProjectTitleName]","codeName");
							var titName = getWF (wokListbox.selection.index,"[ProjectTitleName]","titleName");
							var curObj = wokListbox.add("item","* "+titCode.toUpperCase()+" "+titName ,wokListbox.selection.index+1);
							wokListbox.remove(wokListbox.selection);
							wokListbox.selection = curObj;
							changeUI = null;
						}
					}
				
				
					//納品ムービー保存フォルダ
					addY = CpYb*4;
					
					saveSetTabGrpObj_B = saveSetTab.add("group");
					saveSetTabGrpObj_B.orientation = "row";
					saveSetTabGrpObj_B.alignment = ["fill","top"];
					saveSetTabGrpObj_B.spacing = spacing;
					saveSetTabGrpObj_B.margins = margins;
					
					saveSetTabGrpObj_B1 = saveSetTabGrpObj_B.add("group");
					saveSetTabGrpObj_B1.alignment = ["left","top"];

					var ssRecFolderCaption = saveSetTabGrpObj_B1.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "RecFolder : " ); ssRecFolderCaption.justify="right";
					var ssRecFolderBtn = saveSetTabGrpObj_B1.add( "button" , [ssRecFolderCaption.bounds[2]+EdXs,EdYs+addY ,ssRecFolderCaption.bounds[2]+EdXs+80,EdYs+EdYb+addY ] , "Choose..." );
					addY = CpYb*6;
					ssRecFolderEdit = saveSetTabGrpObj_B1.add( "statictext" ); ssRecFolderEdit.justify="left";
					ssRecFolderEdit.preferredSize = [466,16];
					ssRecFolderBtn.onClick = function()
					{
						var curFolderObj = new Folder(ssRecFolderEdit.text);
						ssRecFolderDirectory = curFolderObj.selectDlg("Output to...");
						if ( ssRecFolderDirectory != null )
						{
							changeUI = true;
							ssRecFolderEdit.text = ssRecFolderDirectory.fsName;					
							workFormat[wokListbox.selection.index] = getCurWorkFormatUISettings();
							var titCode = getWF (wokListbox.selection.index,"[ProjectTitleName]","codeName");
							var titName = getWF (wokListbox.selection.index,"[ProjectTitleName]","titleName");
							var curObj = wokListbox.add("item","* "+titCode.toUpperCase()+" "+titName ,wokListbox.selection.index+1);
							wokListbox.remove(wokListbox.selection);
							wokListbox.selection = curObj;
							changeUI = null;
						}
					}
				

				
					//Archive用ムービー保存フォルダ
					addY = CpYb*8;
					
					saveSetTabGrpObj_C = saveSetTab.add("group");
					saveSetTabGrpObj_C.orientation = "row";
					saveSetTabGrpObj_C.alignment = ["fill","top"];
					saveSetTabGrpObj_C.spacing = spacing;
					saveSetTabGrpObj_C.margins = margins;

					saveSetTabGrpObj_C1 = saveSetTabGrpObj_C.add("group");
					saveSetTabGrpObj_C1.alignment = ["left","top"];
					
					var ssArchiveFolderCaption = saveSetTabGrpObj_C1.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "ArchiveFolder : " ); ssArchiveFolderCaption.justify="right";
					var ssArchiveFolderBtn = saveSetTabGrpObj_C1.add( "button" , [ssArchiveFolderCaption.bounds[2]+EdXs,EdYs+addY ,ssArchiveFolderCaption.bounds[2]+EdXs+80,EdYs+EdYb+addY ] , "Choose..." );
					addY = CpYb*10;
					ssArchiveFolderEdit = saveSetTabGrpObj_C1.add( "statictext" ); ssArchiveFolderEdit.justify="left";
					ssArchiveFolderEdit.preferredSize = [466,16];
					ssArchiveFolderBtn.onClick = function()
					{
						var curFolderObj = new Folder(ssArchiveFolderEdit.text);
						ssArchiveFolderDirectory = curFolderObj.selectDlg("Output to...");
						if ( ssArchiveFolderDirectory != null )
						{
							changeUI = true;
							ssArchiveFolderEdit.text = ssArchiveFolderDirectory.fsName;					
							workFormat[wokListbox.selection.index] = getCurWorkFormatUISettings();
							var titCode = getWF (wokListbox.selection.index,"[ProjectTitleName]","codeName");
							var titName = getWF (wokListbox.selection.index,"[ProjectTitleName]","titleName");
							var curObj = wokListbox.add("item","* "+titCode.toUpperCase()+" "+titName ,wokListbox.selection.index+1);
							wokListbox.remove(wokListbox.selection);
							wokListbox.selection = curObj;
							changeUI = null;
						}
					}
	
				//Effects Settings ***********************************************************
				
				//スムージングプラグイン
				addY = CpYb*0;
				fxSetTabGrpObj_A = fxSetTab.add("group");
				fxSetTabGrpObj_A.orientation = "row";
				fxSetTabGrpObj_A.alignment = ["fill","top"];
				fxSetTabGrpObj_A.spacing = spacing;
				fxSetTabGrpObj_A.margins = margins;

				var esSmoothTypeCaption = fxSetTabGrpObj_A.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "smooth Type : " ); esSmoothTypeCaption.justify="right";
				esSmoothTypeEdit = fxSetTabGrpObj_A.add( "edittext" , [esSmoothTypeCaption.bounds[2]+EdXs,EdYs+addY ,esSmoothTypeCaption.bounds[2]+EdXs+EdXb*16,EdYs+EdYb+addY ] , /*curStr*/ ); esSmoothTypeEdit.justify="right";

				//ネスト時またはレンダーキューでフレームレートを保持
				addY = CpYb*2;
				fxSetTabGrpObj_B = fxSetTab.add("group");
				fxSetTabGrpObj_B.orientation = "row";
				fxSetTabGrpObj_B.alignment = ["fill","top"];
				fxSetTabGrpObj_B.spacing = spacing;
				fxSetTabGrpObj_B.margins = margins;
				
				var esPreserveFpsCaption = fxSetTabGrpObj_B.add( "statictext" , [CpXs,CpYs+addY ,CpXb*16,CpYs+CpYb+addY ] , "preserve Fps : " ); esPreserveFpsCaption.justify="right";
				esPreserveFpsCb = fxSetTabGrpObj_B.add( "checkbox" , [esPreserveFpsCaption.bounds[2]+CpXs,CpYs+addY ,esPreserveFpsCaption.bounds[2]+CpXs+CpXb*16,CpYs+CpYb+addY ] , /*curValue*/ );
				
				//Token Settings ***********************************************************

				tokSetTabGrpObj = tokSetTab.add("group");
				tokSetTabGrpObj.orientation = "column";
				tokSetTabGrpObj.alignment = ["fill","top"];
				tokSetTabGrpObj.spacing = spacing;
				tokSetTabGrpObj.margins = margins;
				
				tokSetTabGrpObj_A = tokSetTabGrpObj.add("group");
				tokSetTabGrpObj_A.alignment = ["left","top"];
				
				//カットフォルダー名
				addY = CpYb*0;
				var tsCutFolderNameCaption = tokSetTabGrpObj_A.add( "statictext" , [CpXs,CpYs+addY ,CpXb*24,CpYs+CpYb+addY ] , "cutFolderName : " ); tsCutFolderNameCaption.justify="right";
				tsCutFolderNameEdit = tokSetTabGrpObj_A.add( "edittext" , [tsCutFolderNameCaption.bounds[2]+EdXs,EdYs+addY ,tsCutFolderNameCaption.bounds[2]+EdXs+EdXb*40,EdYs+EdYb+addY ] , /*curStr*/ ); tsCutFolderNameEdit.justify="right";

				tokSetTabGrpObj_B = tokSetTabGrpObj.add("group");
				tokSetTabGrpObj_B.alignment = ["left","top"];
				
				//AEP名
				addY = CpYb*2;
				var tsAepNameCaption = tokSetTabGrpObj_B.add( "statictext" , [CpXs,CpYs+addY ,CpXb*24,CpYs+CpYb+addY ] , "aepName : " ); tsAepNameCaption.justify="right";
				tsAepNameEdit = tokSetTabGrpObj_B.add( "edittext" , [tsAepNameCaption.bounds[2]+EdXs,EdYs+addY ,tsAepNameCaption.bounds[2]+EdXs+EdXb*40,EdYs+EdYb+addY ] ); tsAepNameEdit.justify="right";
				
				tokSetTabGrpObj_C = tokSetTabGrpObj.add("group");
				tokSetTabGrpObj_C.alignment = ["left","top"];
				
				//レンダリング最終コンポ名
				addY = CpYb*4;
				var tsRenderingCompNameCaption = tokSetTabGrpObj_C.add( "statictext" , [CpXs,CpYs+addY ,CpXb*24,CpYs+CpYb+addY ] , "RenderingCompName : " ); tsRenderingCompNameCaption.justify="right";
				tsRenderingCompNameEdit = tokSetTabGrpObj_C.add( "edittext" , [tsRenderingCompNameCaption.bounds[2]+EdXs,EdYs+addY ,tsRenderingCompNameCaption.bounds[2]+EdXs+EdXb*40,EdYs+EdYb+addY ] ); tsRenderingCompNameEdit.justify="right";

				tokSetTabGrpObj_D = tokSetTabGrpObj.add("group");
				tokSetTabGrpObj_D.alignment = ["left","top"];
				
				//仕分けフォルダー名
				addY = CpYb*6;
				var tsSaveCategoryFolderNameCaption = tokSetTabGrpObj_D.add( "statictext" , [CpXs,CpYs+addY ,CpXb*24,CpYs+CpYb+addY ] , "SaveCategoryFolderName : " ); tsSaveCategoryFolderNameCaption.justify="right";
				tsSaveCategoryFolderNameEdit = tokSetTabGrpObj_D.add( "edittext" , [tsSaveCategoryFolderNameCaption.bounds[2]+EdXs,EdYs+addY ,tsSaveCategoryFolderNameCaption.bounds[2]+EdXs+EdXb*40,EdYs+EdYb+addY ] ); tsSaveCategoryFolderNameEdit.justify="right";

				tokSetTabGrpObj_E = tokSetTabGrpObj.add("group");
				tokSetTabGrpObj_E.alignment = ["left","top"];
				
				//シーケンスフォルダ名
				addY = CpYb*8;
				var tsSaveSequenceFolderNameCaption = tokSetTabGrpObj_E.add( "statictext" , [CpXs,CpYs+addY ,CpXb*24,CpYs+CpYb+addY ] , "SaveSequenceFolderName : " ); tsSaveSequenceFolderNameCaption.justify="right";
				tsSaveSequenceFolderNameEdit = tokSetTabGrpObj_E.add( "edittext" , [tsSaveSequenceFolderNameCaption.bounds[2]+EdXs,EdYs+addY ,tsSaveSequenceFolderNameCaption.bounds[2]+EdXs+EdXb*40,EdYs+EdYb+addY ] ); tsSaveSequenceFolderNameEdit.justify="right";

				tokSetTabGrpObj_F = tokSetTabGrpObj.add("group");
				tokSetTabGrpObj_F.alignment = ["left","top"];
				
				//シーケンスファイル保存名
				addY = CpYb*10;
				var tsSaveSequenceNameCaption = tokSetTabGrpObj_F.add( "statictext" , [CpXs,CpYs+addY ,CpXb*24,CpYs+CpYb+addY ] , "SaveSequenceName : " ); tsSaveSequenceNameCaption.justify="right";
				tsSaveSequenceNameEdit = tokSetTabGrpObj_F.add( "edittext" , [tsSaveSequenceNameCaption.bounds[2]+EdXs,EdYs+addY ,tsSaveSequenceNameCaption.bounds[2]+EdXs+EdXb*40,EdYs+EdYb+addY ] ); tsSaveSequenceNameEdit.justify="right";

				tokSetTabGrpObj_G = tokSetTabGrpObj.add("group");
				tokSetTabGrpObj_G.alignment = ["left","top"];
				
				//ムービーファイル保存名
				addY = CpYb*12;
				var tsSaveMovNameCaption = tokSetTabGrpObj_G.add( "statictext" , [CpXs,CpYs+addY ,CpXb*24,CpYs+CpYb+addY ] , "SaveMovName : " ); tsSaveMovNameCaption.justify="right";
				tsSaveMovNameEdit = tokSetTabGrpObj_G.add( "edittext" , [tsSaveMovNameCaption.bounds[2]+EdXs,EdYs+addY ,tsSaveMovNameCaption.bounds[2]+EdXs+EdXb*40,EdYs+EdYb+addY ] ); tsSaveMovNameEdit.justify="right";

				tokSetTabGrpObj_H = tokSetTabGrpObj.add("group");
				tokSetTabGrpObj_H.alignment = ["left","top"];
				
				//伝票CutNo名
				addY = CpYb*14;
				var tsInvoiceCutNoNameCaption = tokSetTabGrpObj_H.add( "statictext" , [CpXs,CpYs+addY ,CpXb*24,CpYs+CpYb+addY ] , "InvoiceCutNoName : " ); tsInvoiceCutNoNameCaption.justify="right";
				tsInvoiceCutNoNameEdit = tokSetTabGrpObj_H.add( "edittext" , [tsInvoiceCutNoNameCaption.bounds[2]+EdXs,EdYs+addY ,tsInvoiceCutNoNameCaption.bounds[2]+EdXs+EdXb*40,EdYs+EdYb+addY ] ); tsInvoiceCutNoNameEdit.justify="right";

		//wokListbox選択アクション
		wokListbox.onChange = function()
		{
			if ( changeUI == null && wokListbox.selection != null ){ loadWorkFormatCacheToUI(wokListbox.selection.index); }
		}
	
		//WFUI onChange
		titCodeEdit.onChange = titNameEdit.onChange =
		finSizeXEdit.onChange = finSizeYEdit.onChange = finFpsDDlist.onChange = finBolDurEdit.onChange = finQtCodecEdit.onChange =
		finSeqRenSetDDlist.onChange = finSeqOutMdlDDlist.onChange =
		finMovRenSetDDlist.onChange = finMovOutMdlDDlist.onChange =
		finChkMovRenSetDDlist.onChange = finChkMovOutMdlDDlist.onChange = finChkMovFpsDDlist.onChange =
		timSizeXEdit.onChange = timSizeYEdit.onChange = timFpsDDlist.onChange = timBolDurEdit.onChange = timQtCodecEdit.onChange =
		timSeqRenSetDDlist.onChange = timSeqOutMdlDDlist.onChange =
		timMovRenSetDDlist.onChange = timMovOutMdlDDlist.onChange =
		timChkMovRenSetDDlist.onChange = timChkMovOutMdlDDlist.onChange = timChkMovFpsDDlist.onChange =
		esSmoothTypeEdit.onChange = esPreserveFpsCb.onClick =
		tsCutFolderNameEdit.onChange = tsAepNameEdit.onChange = tsRenderingCompNameEdit.onChange =
		tsSaveCategoryFolderNameEdit.onChange = tsSaveSequenceFolderNameEdit.onChange = tsSaveSequenceNameEdit.onChange =
		tsSaveMovNameEdit.onChange = tsInvoiceCutNoNameEdit.onChange = function()
		{
			if ( changeUI == null && wokListbox.selection != null )
			{
				changeUI = true;
				workFormat[wokListbox.selection.index] = getCurWorkFormatUISettings();
				var titCode = getWF (wokListbox.selection.index,"[ProjectTitleName]","codeName");
				var titName = getWF (wokListbox.selection.index,"[ProjectTitleName]","titleName");
				var curObj = wokListbox.add("item","* "+titCode.toUpperCase()+" "+titName ,wokListbox.selection.index+1);
				wokListbox.remove(wokListbox.selection);
				wokListbox.selection = curObj;
				changeUI = null;
			}
		};

		//wfNewボタン
		addY = EdYb*1;
		var wokNewBtn = wokTabGrpObj_L2.add( "button" , [CpXs,wokListbox.bounds[3]+EdYs,CpXs+82,wokListbox.bounds[3]+EdYs+addY] , "New" );
		wokNewBtn.onClick = function()
		{
			Btnon = "wfNew";
			if ( workFormat.length != 0 )
			{
				workFormat.unshift(newWorkFormat());
				loadWorkFormatCacheToListBox();
				wokListbox.selection = wokListbox.items[0];
				loadWorkFormatCacheToUI(0);
				changeUI = null;
			}
		}
	
		//wfDuplicateボタン
		var wokDuplicateBtn = wokTabGrpObj_L2.add( "button" , [wokNewBtn.bounds[2]+EdXs,wokListbox.bounds[3]+EdYs,wokNewBtn.bounds[2]+EdXs+82,wokListbox.bounds[3]+EdYs+addY] , "Duplicate" );
		wokDuplicateBtn.onClick = function()
		{
			if (wokListbox.selection)
			{			
				Btnon = "wfDuplicate";
				changeUI = true;
				titCodeEdit.text = "copy";
				workFormat.push(getCurWorkFormatUISettings());
				var newIndex = wokListbox.selection.index+1;
				var newWorkFormatList = [];
				for ( i = 0; i < workFormat.length; i++ )
				{
					if (i < newIndex){newWorkFormatList.push(workFormat[i]);}
					if (i == newIndex){newWorkFormatList.push(workFormat[workFormat.length-1]);}
					if (i > newIndex){newWorkFormatList.push(workFormat[i-1]);}
				}
				workFormat = newWorkFormatList;
				wokListbox.selection = wokListbox.add("item","* "+wokListbox.selection.text+" copy",wokListbox.selection.index+1);
				changeUI = null;
			}
		}

		//wfReloadボタン
		var wokReloadBtn = wokTabGrpObj_L3.add( "button" , [CpXs,wokNewBtn.bounds[3]+EdYs,CpXs+82,wokNewBtn.bounds[3]+EdYs+addY] , "Reload" );
		wokReloadBtn.onClick = function()
		{
			Btnon = "wfReload";
			changeUI = true;
			loadWorkFormatFile( wfGlobalSaveDirectory );
			if ( workFormat.length != 0 )
			{
				showWorkFormatUI();
				loadWorkFormatCacheToListBox();
				wokListbox.selection = wokListbox.items[0];
				loadWorkFormatCacheToUI(0);
			}
			else
			{
				hideWorkFormatUI();
			}
			changeUI = null;
		}
		
		//wfDleteボタン
		var wokDeleteBtn = wokTabGrpObj_L3.add( "button" , [wokNewBtn.bounds[2]+EdXs,wokNewBtn.bounds[3]+EdYs,wokNewBtn.bounds[2]+EdXs+82,wokNewBtn.bounds[3]+EdYs+addY] , "Delete" );
		wokDeleteBtn.onClick = function()
		{
			if (wokListbox.selection)
			{
				if ( confirm(wokListbox.selection.toString()+"を削除してよろしいですか？"+CR+"この項目はすぐ削除されます。この操作は取り消せません。",true) )
				{
					Btnon = "wfDelete";
					var titCode = getWF (wokListbox.selection.index,"[ProjectTitleName]","codeName");
					var curWfPrefFile = new File( wfGlobalSaveDirectory.fsName + "/" + "_" + titCode.toUpperCase() + "_Pref.txt" );
					if ( curWfPrefFile.exists == true )
					{
						curWfPrefFile.remove();
						loadWorkFormatFile( wfGlobalSaveDirectory );
					}
					else
					{
						workFormat = workFormat.slice(0,wokListbox.selection.index).concat(workFormat.slice(wokListbox.selection.index+1,workFormat.length+1));
					}
					if ( workFormat.length != 0 )
					{
						showWorkFormatUI();
						loadWorkFormatCacheToListBox();
						wokListbox.selection = wokListbox.items[0];
						loadWorkFormatCacheToUI(0);
						changeUI = null;
					}
					else
					{
						hideWorkFormatUI();
					}
				}
			}
		}

		//wfSaveボタン
		addY = EdYb*2;
		var wokSaveBtn = wokTabGrpObj_R.add( "button" , [851+CpXs,754-addY,851+CpXs+96,754] , "Save" );
		wokSaveBtn.onClick = function()
		{
			Btnon = "wfSave";
			if (wokListbox.selection)
			{
				if (checkWorkFormatUI() == null)
				{
					var titCode = getWF (wokListbox.selection.index,"[ProjectTitleName]","codeName");
					var titName = getWF (wokListbox.selection.index,"[ProjectTitleName]","titleName");
					if ( confirm(titCode.toUpperCase()+" "+titName+"を以下の内容で保存してよろしいですか？"+CR+getCurWorkFormatUISettings(),true) )
					{
						//現在のUI情報をWFキャッシュに保存
						workFormat[wokListbox.selection.index] = getCurWorkFormatUISettings();
						//WFキャッシュをファイルに保存
						var curWfPrefFile = new File( wfGlobalSaveDirectory.fsName + "/" + "_" + titCode.toUpperCase() + "_Pref.txt" );
						if ( curWfPrefFile.exists == true ) { curWfPrefFile.remove(); }
						curWfPrefFile.open("w");
						curWfPrefFile.write(workFormat[wokListbox.selection.index]);
						curWfPrefFile.close();
						
						//loadWorkFormatFile( wfGlobalSaveDirectory );
						if ( workFormat.length != 0 )
						{
							showWorkFormatUI();
							//loadWorkFormatCacheToListBox();
							changeUI = true;
							workFormat[wokListbox.selection.index] = getCurWorkFormatUISettings();
							var titCode = getWF (wokListbox.selection.index,"[ProjectTitleName]","codeName");
							var titName = getWF (wokListbox.selection.index,"[ProjectTitleName]","titleName");
							var curObj = wokListbox.add("item",titCode.toUpperCase()+" "+titName ,wokListbox.selection.index+1);
							wokListbox.remove(wokListbox.selection);
							for ( i = 0; i < workFormat.length; i++ )
							{
								if ( titCode == getWF ( i ,"[ProjectTitleName]","codeName") ){break;}
							}
							wokListbox.selection = wokListbox.items[i];
							loadWorkFormatCacheToUI(i);
							alert("!4");
							changeUI = null;
						}
						else
						{
							hideWorkFormatUI();
						}
					}
				}
			}
		}


		//NatesTab
		//内容未定
		//更新内容とか
		//作業ログ

		closeBtn = cprDlg.add( "button" , undefined , "Close" , {name:"ok"});
		closeBtn.preferredSize = [96,20];
		closeBtn.alignment = ["right","bottom"];
		closeBtn.onClick = function() { Btnon = "Close"; cprDlg.close(); }
		
		if ( workFormat.length != 0 )
		{
			loadWorkFormatCacheToListBox();
			wokListbox.selection = wokListbox.items[0];
			loadWorkFormatCacheToUI(0);
			changeUI = null;
		}
		else
		{hideWorkFormatUI();}
		cprTpl.selection = wokTab;//WorksTabを選択
		cprDlg.center();
		cprDlg.show();
}
// **** FUNCTION ******************************************************************************************************************
//		カラーパレットがクリックされたらカラーピックで色を取得
			function projColGrpFrontMdFunc(e)
		{
			var getRGBA = colorPick( projColGrpFrontUI.backgroundColor.color );
			var uiBrush = projColGrpFrontUI.newBrush(projColGrpFrontUI.BrushType.SOLID_COLOR, [getRGBA[0],getRGBA[1], getRGBA[2],1]);
			projColGrpFrontUI.backgroundColor = uiBrush;
			if ( changeUI == null && wokListbox.selection != null )
			{
				changeUI = true;
				workFormat[wokListbox.selection.index] = getCurWorkFormatUISettings();
				var titCode = getWF (wokListbox.selection.index,"[ProjectTitleName]","codeName");
				var titName = getWF (wokListbox.selection.index,"[ProjectTitleName]","titleName");
				var curObj = wokListbox.add("item","* "+titCode.toUpperCase()+" "+titName ,wokListbox.selection.index+1);
				wokListbox.remove(wokListbox.selection);
				wokListbox.selection = curObj;
				changeUI = null;
			}
			alert( "作品カラーを変更しました。" );		
		}
// **** FUNCTION ******************************************************************************************************************
//		WorkFormatファイル読み込みによるUI表示
		function showWorkFormatUI()
{
		lastUpdateCaption.show();
		titleSetPnl.show();
		renderSetTpl.show();
		//renderSetTpl.selection = finSetTab;
		return hideWfUI = null;
}
// **** FUNCTION ******************************************************************************************************************
//		WorkFormatファイル読み込みErrorによるUI非表示
		function hideWorkFormatUI()
{
		wokListbox.removeAll();
		lastUpdateCaption.hide();
		titleSetPnl.hide();
		renderSetTpl.hide();
		return hideWfUI = true;
}
// **** FUNCTION ******************************************************************************************************************
//		UI情報をチェック
		function checkWorkFormatUI()
{
		checkResult = null;
		if (checkResult != null ){alert("以下のWorkFormat情報が正しくありません。" + CR + checkResult);}
		return checkResult;
}
// **** FUNCTION ******************************************************************************************************************
//		WFリスト情報をキャッシュからListBoxに読み込み
		function loadWorkFormatCacheToListBox()
{
		changeUI = true;
		wokListbox.removeAll();
		for ( i = 0; i < workFormat.length; i++ )
		{
			wokListbox.selection = wokListbox.items[i];
			var titCode = getWF ( i ,"[ProjectTitleName]","codeName");
			var titName = getWF ( i ,"[ProjectTitleName]","titleName");
			try {wokListbox.add("item", titCode.toUpperCase()+" "+titName);}
			catch(e){wokListbox.add("item","Load Error");}
		}
}
// **** FUNCTION ******************************************************************************************************************
//		指定したWF情報をキャッシュからUIに読み込み
		function loadWorkFormatCacheToUI(index)
{
		changeUI = true;
		var i = index;
		//WFUIをWFキャッシュから読み込んで更新
		//[Update]
		lastUpdateCaption.text = "user : "+getWF ( i ,"[Update]","user")+TAB+TAB+"最終更新日 : "+getWF ( i ,"[Update]","lastUpDate");
		//[ProjectTitleName]
		titCodeEdit.text = getWF ( i ,"[ProjectTitleName]","codeName");
		titNameEdit.text = getWF ( i ,"[ProjectTitleName]","titleName");

		var getHexRGB = getWF ( i ,"[ProjectTitleName]","projColor");
		if (getHexRGB == null)
		{ getRGBA = [0.25,0.25,0.25,1]; }
		else
		{ getRGBA = convertToRGB( getHexRGB ); }
		var uiBrush = projColGrpFrontUI.newBrush( projColGrpFrontUI.BrushType.SOLID_COLOR , getRGBA );
		projColGrpFrontUI.backgroundColor = uiBrush;
		//alert("loadWFCacheToUI : "+getRGBA.toString());
		
		//[FinalRenderSettings]
		finSizeXEdit.text = getWF ( i ,"[FinalRenderSettings]","X");
		finSizeYEdit.text = getWF ( i ,"[FinalRenderSettings]","Y");
		var curStr = getWF ( i ,"[FinalRenderSettings]","FPS");
		for ( n = 0; n < finFpsDDlist.items.length; n++ ) { if (curStr == finFpsDDlist.items[n].toString()){finFpsDDlist.selection = finFpsDDlist.items[n] ;}}
		finBolDurEdit.text = getWF ( i ,"[FinalRenderSettings]","boldDuration");
		finQtCodecEdit.text = getWF ( i ,"[FinalRenderSettings]","Codec");
		var curStr = getWF ( i ,"[FinalRenderSettings]","Sequence : RenderSettings");
		for ( n = 0; n < finSeqRenSetDDlist.items.length; n++ ) { if (curStr == finSeqRenSetDDlist.items[n].toString()){finSeqRenSetDDlist.selection = finSeqRenSetDDlist.items[n] ;}}
		var curStr = getWF ( i ,"[FinalRenderSettings]","Sequence : OutputModule");
		for ( n = 0; n < finSeqOutMdlDDlist.items.length; n++ ) { if (curStr == finSeqOutMdlDDlist.items[n].toString()){finSeqOutMdlDDlist.selection = finSeqOutMdlDDlist.items[n] ;}}
		var curStr = getWF ( i ,"[FinalRenderSettings]","Mov : RenderSettings");
		for ( n = 0; n < finMovRenSetDDlist.items.length; n++ ) { if (curStr == finMovRenSetDDlist.items[n].toString()){finMovRenSetDDlist.selection = finMovRenSetDDlist.items[n] ;}}
		var curStr = getWF ( i ,"[FinalRenderSettings]","Mov : OutputModule");
		for ( n = 0; n < finMovOutMdlDDlist.items.length; n++ ) { if (curStr == finMovOutMdlDDlist.items[n].toString()){finMovOutMdlDDlist.selection = finMovOutMdlDDlist.items[n] ;}}
		var curStr = getWF ( i ,"[FinalRenderSettings]","checkMov : RenderSettings");
		for ( n = 0; n < finChkMovRenSetDDlist.items.length; n++ ) { if (curStr == finChkMovRenSetDDlist.items[n].toString()){finChkMovRenSetDDlist.selection = finChkMovRenSetDDlist.items[n] ;}}
		var curStr = getWF ( i ,"[FinalRenderSettings]","checkMov : OutputModule");
		for ( n = 0; n < finChkMovOutMdlDDlist.items.length; n++ ) { if (curStr == finChkMovOutMdlDDlist.items[n].toString()){finChkMovOutMdlDDlist.selection = finChkMovOutMdlDDlist.items[n] ;}}
		var curStr = getWF ( i ,"[FinalRenderSettings]","checkMov : FPS");
		for ( n = 0; n < finChkMovFpsDDlist.items.length; n++ ) { if (curStr == finChkMovFpsDDlist.items[n].toString()){finChkMovFpsDDlist.selection = finChkMovFpsDDlist.items[n] ;}}
		//[TimingRenderSettings]
		timSizeXEdit.text = getWF ( i ,"[TimingRenderSettings]","X");
		timSizeYEdit.text = getWF ( i ,"[TimingRenderSettings]","Y");
		var curStr = getWF ( i ,"[TimingRenderSettings]","FPS");
		for ( n = 0; n < timFpsDDlist.items.length; n++ ) { if (curStr == timFpsDDlist.items[n].toString()){timFpsDDlist.selection = timFpsDDlist.items[n] ;}}
		timBolDurEdit.text = getWF ( i ,"[TimingRenderSettings]","boldDuration");
		timQtCodecEdit.text = getWF ( i ,"[TimingRenderSettings]","Codec");
		var curStr = getWF ( i ,"[TimingRenderSettings]","Sequence : RenderSettings");
		for ( n = 0; n < timSeqRenSetDDlist.items.length; n++ ) { if (curStr == timSeqRenSetDDlist.items[n].toString()){timSeqRenSetDDlist.selection = timSeqRenSetDDlist.items[n] ;}}
		var curStr = getWF ( i ,"[TimingRenderSettings]","Sequence : OutputModule");
		for ( n = 0; n < timSeqOutMdlDDlist.items.length; n++ ) { if (curStr == timSeqOutMdlDDlist.items[n].toString()){timSeqOutMdlDDlist.selection = timSeqOutMdlDDlist.items[n] ;}}
		var curStr = getWF ( i ,"[TimingRenderSettings]","Mov : RenderSettings");
		for ( n = 0; n < timMovRenSetDDlist.items.length; n++ ) { if (curStr == timMovRenSetDDlist.items[n].toString()){timMovRenSetDDlist.selection = timMovRenSetDDlist.items[n] ;}}
		var curStr = getWF ( i ,"[TimingRenderSettings]","Mov : OutputModule");
		for ( n = 0; n < timMovOutMdlDDlist.items.length; n++ ) { if (curStr == timMovOutMdlDDlist.items[n].toString()){timMovOutMdlDDlist.selection = timMovOutMdlDDlist.items[n] ;}}
		var curStr = getWF ( i ,"[TimingRenderSettings]","checkMov : RenderSettings");
		for ( n = 0; n < timChkMovRenSetDDlist.items.length; n++ ) { if (curStr == timChkMovRenSetDDlist.items[n].toString()){timChkMovRenSetDDlist.selection = timChkMovRenSetDDlist.items[n] ;}}
		var curStr = getWF ( i ,"[TimingRenderSettings]","checkMov : OutputModule");
		for ( n = 0; n < timChkMovOutMdlDDlist.items.length; n++ ) { if (curStr == timChkMovOutMdlDDlist.items[n].toString()){timChkMovOutMdlDDlist.selection = timChkMovOutMdlDDlist.items[n] ;}}
		var curStr = getWF ( i ,"[TimingRenderSettings]","checkMov : FPS");
		for ( n = 0; n < timChkMovFpsDDlist.items.length; n++ ) { if (curStr == timChkMovFpsDDlist.items[n].toString()){timChkMovFpsDDlist.selection = timChkMovFpsDDlist.items[n] ;}}
		//[SaveSettings]
		ssMovExFolderEdit.text = getWF ( i ,"[SaveSettings]","MovExFolder");
		ssRecFolderEdit.text = getWF ( i ,"[SaveSettings]","RecFolder");
		ssArchiveFolderEdit.text = getWF ( i ,"[SaveSettings]","ArchiveFolder");
		//[EffectSettings]
		esSmoothTypeEdit.text = getWF ( i ,"[EffectSettings]","SmoothType");
		esPreserveFpsCb.value = getWF ( i ,"[EffectSettings]","PreserveFps");
		//[TokenSettings]
		tsCutFolderNameEdit.text = getWF ( i ,"[TokenSettings]","cutFolderName");
		tsAepNameEdit.text = getWF ( i ,"[TokenSettings]","aepName");
		tsRenderingCompNameEdit.text = getWF ( i ,"[TokenSettings]","RenderingCompName");
		tsSaveCategoryFolderNameEdit.text = getWF ( i ,"[TokenSettings]","SaveCategoryFolderName");
		tsSaveSequenceFolderNameEdit.text = getWF ( i ,"[TokenSettings]","SaveSequenceFolderName");
		tsSaveSequenceNameEdit.text = getWF ( i ,"[TokenSettings]","SaveSequenceName");
		tsSaveMovNameEdit.text = getWF ( i ,"[TokenSettings]","SaveMovName");
		tsInvoiceCutNoNameEdit.text = getWF ( i ,"[TokenSettings]","InvoiceCutNoName");
		changeUI = null;
}
// **** FUNCTION ******************************************************************************************************************
//		現在のUI情報を取得
		function getCurWorkFormatUISettings()
{
		getCurDate();
		var getHexRGB = convertToHexRGB( projColGrpFrontUI.backgroundColor.color );
		//alert("getCurWfUISettings : "+getHexRGB.toString());
		
		return curWorkFormatUISettings =
		"//CSUMCCPreferenses"+TAB+CR+
		TAB+CR+
		"[Update]"+TAB+CR+
		TAB+"lastUpDate"+TAB+curDate+TAB+CR+
		TAB+"user"+TAB+csumiDName+TAB+CR+
		TAB+CR+
		"[ProjectTitleName]"+TAB+CR+
		TAB+"codeName"+TAB+titCodeEdit.text+TAB+CR+
		TAB+"titleName"+TAB+titNameEdit.text+TAB+CR+
		TAB+"projColor"+TAB+getHexRGB+TAB+CR+
		TAB+CR+
		"[FinalRenderSettings]"+TAB+CR+
		TAB+"X"+TAB+finSizeXEdit.text+TAB+CR+
		TAB+"Y"+TAB+finSizeYEdit.text+TAB+CR+
		TAB+"FPS"+TAB+finFpsDDlist.selection.text+TAB+CR+
		TAB+"boldDuration"+TAB+finBolDurEdit.text+TAB+CR+
		TAB+"Codec"+TAB+finQtCodecEdit.text+TAB+CR+
		TAB+"Sequence : RenderSettings"+TAB+finSeqRenSetDDlist.selection.text+TAB+CR+
		TAB+"Sequence : OutputModule"+TAB+finSeqOutMdlDDlist.selection.text+TAB+CR+
		TAB+"Mov : RenderSettings"+TAB+finMovRenSetDDlist.selection.text+TAB+CR+
		TAB+"Mov : OutputModule"+TAB+finMovOutMdlDDlist.selection.text+TAB+CR+
		TAB+"checkMov : RenderSettings"+TAB+finChkMovRenSetDDlist.selection.text+TAB+CR+
		TAB+"checkMov : OutputModule"+TAB+finChkMovOutMdlDDlist.selection.text+TAB+CR+
		TAB+"checkMov : FPS"+TAB+finChkMovFpsDDlist.selection.text+TAB+CR+
		TAB+CR+
		"[TimingRenderSettings]"+TAB+CR+
		TAB+"X"+TAB+timSizeXEdit.text+TAB+CR+
		TAB+"Y"+TAB+timSizeYEdit.text+TAB+CR+
		TAB+"FPS"+TAB+timFpsDDlist.selection.text+TAB+CR+
		TAB+"boldDuration"+TAB+timBolDurEdit.text+TAB+CR+
		TAB+"Codec"+TAB+timQtCodecEdit.text+TAB+CR+
		TAB+"Sequence : RenderSettings"+TAB+timSeqRenSetDDlist.selection.text+TAB+CR+
		TAB+"Sequence : OutputModule"+TAB+timSeqOutMdlDDlist.selection.text+TAB+CR+
		TAB+"Mov : RenderSettings"+TAB+timMovRenSetDDlist.selection.text+TAB+CR+
		TAB+"Mov : OutputModule"+TAB+timMovOutMdlDDlist.selection.text+TAB+CR+
		TAB+"checkMov : RenderSettings"+TAB+timChkMovRenSetDDlist.selection.text+TAB+CR+
		TAB+"checkMov : OutputModule"+TAB+timChkMovOutMdlDDlist.selection.text+TAB+CR+
		TAB+"checkMov : FPS"+TAB+timChkMovFpsDDlist.selection.text+TAB+CR+
		TAB+CR+
		"[SaveSettings]"+TAB+CR+
		TAB+"MovExFolder"+TAB+ssMovExFolderEdit.text+TAB+CR+
		TAB+"RecFolder"+TAB+ssRecFolderEdit.text+TAB+CR+
		TAB+"ArchiveFolder"+TAB+ssArchiveFolderEdit.text+TAB+CR+
		TAB+CR+
		"[EffectSettings]"+TAB+CR+
		TAB+"SmoothType"+TAB+esSmoothTypeEdit.text+TAB+CR+
		TAB+"PreserveFps"+TAB+esPreserveFpsCb.value+TAB+CR+
		TAB+CR+
		"[TokenSettings]"+TAB+CR+
		TAB+"cutFolderName"+TAB+tsCutFolderNameEdit.text+TAB+CR+
		TAB+"aepName"+TAB+tsAepNameEdit.text+TAB+CR+
		TAB+"RenderingCompName"+TAB+tsRenderingCompNameEdit.text+TAB+CR+
		TAB+"SaveCategoryFolderName"+TAB+tsSaveCategoryFolderNameEdit.text+TAB+CR+
		TAB+"SaveSequenceFolderName"+TAB+tsSaveSequenceFolderNameEdit.text+TAB+CR+
		TAB+"SaveSequenceName"+TAB+tsSaveSequenceNameEdit.text+TAB+CR+
		TAB+"SaveMovName"+TAB+tsSaveMovNameEdit.text+TAB+CR+
		TAB+"InvoiceCutNoName"+TAB+tsInvoiceCutNoNameEdit.text+TAB;
}
// **** FUNCTION ******************************************************************************************************************
//		新規WorkFormatを宣言
		function newWorkFormat()
{
		getCurDate();
		var getHexRGB = convertToHexRGB( [0.25,0.25,0.25,1] );
		
		return curWfDialogSettings =
		"//CSUMCCPreferenses"+TAB+CR+
		TAB+CR+
		"[Update]"+TAB+CR+
		TAB+"lastUpDate"+TAB+curDate+TAB+CR+
		TAB+"user"+TAB+csumiDName+TAB+CR+
		TAB+CR+
		"[ProjectTitleName]"+TAB+CR+
		TAB+"codeName"+TAB+"* new"+CR+
		TAB+"titleName"+TAB+"Title"+TAB+CR+
		TAB+"projColor"+TAB+getHexRGB+TAB+CR+
		TAB+CR+
		"[FinalRenderSettings]"+TAB+CR+
		TAB+"X"+TAB+"1280"+TAB+CR+
		TAB+"Y"+TAB+"720"+TAB+CR+
		TAB+"FPS"+TAB+"24"+TAB+CR+
		TAB+"boldDuration"+TAB+"8"+TAB+CR+
		TAB+"Codec"+TAB+"アニメーション圧縮"+TAB+CR+
		TAB+"Sequence : RenderSettings"+TAB+""+TAB+CR+
		TAB+"Sequence : OutputModule"+TAB+""+TAB+CR+
		TAB+"Mov : RenderSettings"+TAB+""+TAB+CR+
		TAB+"Mov : OutputModule"+TAB+""+TAB+CR+
		TAB+"checkMov : RenderSettings"+TAB+""+TAB+CR+
		TAB+"checkMov : OutputModule"+TAB+""+TAB+CR+
		TAB+"checkMov : FPS"+TAB+""+TAB+CR+
		TAB+CR+
		"[TimingRenderSettings]"+TAB+CR+
		TAB+"X"+TAB+"1280"+TAB+CR+
		TAB+"Y"+TAB+"720"+TAB+CR+
		TAB+"FPS"+TAB+"24"+TAB+CR+
		TAB+"boldDuration"+TAB+"8"+TAB+CR+
		TAB+"Codec"+TAB+"Photo - JPEG"+TAB+CR+
		TAB+"Sequence : RenderSettings"+TAB+""+TAB+CR+
		TAB+"Sequence : OutputModule"+TAB+""+TAB+CR+
		TAB+"Mov : RenderSettings"+TAB+""+TAB+CR+
		TAB+"Mov : OutputModule"+TAB+""+TAB+CR+
		TAB+"checkMov : RenderSettings"+TAB+""+TAB+CR+
		TAB+"checkMov : OutputModule"+TAB+""+TAB+CR+
		TAB+"checkMov : FPS"+TAB+""+TAB+CR+
		TAB+CR+
		"[SaveSettings]"+TAB+CR+
		TAB+"MovExFolder"+TAB+""+TAB+CR+
		TAB+"RecFolder"+TAB+""+TAB+CR+
		TAB+"ArchiveFolder"+TAB+""+TAB+CR+
		TAB+CR+
		"[EffectSettings]"+TAB+CR+
		TAB+"SmoothType"+TAB+"OLM Smoother"+TAB+CR+
		TAB+"PreserveFps"+TAB+"true"+TAB+CR+
		TAB+CR+
		"[TokenSettings]"+TAB+CR+
		TAB+"cutFolderName"+TAB+"[titleCode]_[act]_[cutNo]"+TAB+CR+
		TAB+"aepName"+TAB+"[titleCode]_[act]_[cutNo]_[take].aep"+TAB+CR+
		TAB+"RenderingCompName"+TAB+"[titleCode]_[act]_[cutNo]_[take]"+TAB+CR+
		TAB+"SaveCategoryFolderName"+TAB+"[titleCode]_[act]"+TAB+CR+
		TAB+"SaveSequenceFolderName"+TAB+"[titleCode]_[act]_[cutNo]_[take]"+TAB+CR+
		TAB+"SaveSequenceName"+TAB+"[titleCode]_[act]_[cutNo]_[take]_[####].[fileExtension]"+TAB+CR+
		TAB+"SaveMovName"+TAB+"[titleCode]_[act]_[cutNo]_[take].[fileExtension]"+TAB+CR+
		TAB+"InvoiceCutNoName"+TAB+"[cutNo]"+TAB;
}
// **** FUNCTION ******************************************************************************************************************
//		現在時刻を取得
		function getCurDate()
{
		var dObj = new Date();
		return curDate = dObj.getFullYear()+"/"+(dObj.getMonth()+1)+"/"+dObj.getDate()+" "+dObj.toLocaleTimeString().slice(0,5);
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