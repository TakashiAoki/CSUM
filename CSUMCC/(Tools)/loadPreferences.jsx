// loadPreferences Ver.2.9
// Copyright (c) 2007-2026 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2026.05.16
// 初期設定、変数、コードを定義します

// **** Main Script ***************************************************************************************************************
		
		//コード
		TAB = String.fromCharCode(9);//タブコード
		LR = String.fromCharCode(10);//改行コード(Mac)
		CR = String.fromCharCode(13);//改行コード
		isWin = ( $.os.indexOf("Windows") !== -1 );//Win判定

		//Win書込用ベース: Program Files配下のScriptsは非管理者では書き込み不可のため、
		//  書込が必要なデータ(=(Cache)[bat出力/WFキャッシュ] と (myCSUM_Pref)[CSUMiD設定/RsOmList/ログ])は
		//  %APPDATA%\CSUMCC (Folder.userData) に退避する。Macは従来通りScripts配下のまま(現状維持)。
		//  読取専用の(Resource)/(Tools)/(Utility)はScripts配下のまま(両OS共通)。
		myCSUMCCWritableBase = isWin ? new Folder( Folder.userData.fsName + "/" + "CSUMCC" ) : null;
		if ( isWin && myCSUMCCWritableBase.exists == false ) myCSUMCCWritableBase.create();

		//ディレクトリ
		myCSUMCCCacheFolder = new Folder( ( isWin ? myCSUMCCWritableBase.fsName : myCSUMCCFolder.fsName ) + "/" + "(Cache)" );//ローカル(Cache)フォルダ
		if ( myCSUMCCCacheFolder.exists == false ) myCSUMCCCacheFolder.create();//AE2026: 初回作成
		myCSUMCCResourceFolder = new Folder( myCSUMCCFolder.fsName + "/" + "(Resource)" );//ローカル(Resource)フォルダ
		myCSUMCCToolsFolder = new Folder( myCSUMCCFolder.fsName + "/" + "(Tools)" );//ローカル(Tools)フォルダ
		myCSUMCCUtilityFolder = new Folder( myCSUMCCFolder.fsName + "/" + "(Utility)" );//ローカル(Utility)フォルダ
		InvoiceTmp = new File( myCSUMCCResourceFolder.fsName + "/" + "InvoiceTmp.txt" );//ローカル撮影伝票テンプレートファイル
		myCSUMPreferenceFolder = new Folder( ( isWin ? myCSUMCCWritableBase.fsName : curAEScriptsFolder.fsName ) + "/" + "(myCSUM_Pref)" );//ローカル(myCSUM_Pref)フォルダ
		if ( myCSUMPreferenceFolder.exists == false ) myCSUMPreferenceFolder.create();
		myCSUMAELogFolder = new Folder( myCSUMPreferenceFolder.fsName + "/" + "myCsumAELog" );//ローカルmyCsumAELogフォルダ
		if ( myCSUMAELogFolder.exists == false ) myCSUMAELogFolder.create();
		myCSUMWorkLogFolder = new Folder( myCSUMPreferenceFolder.fsName + "/" + "myCsumWorkLog" );//ローカルmyCsumWorkLogフォルダ
		if ( myCSUMWorkLogFolder.exists == false ) myCSUMWorkLogFolder.create();
		
		//CSUMiDPrefファイル読み込み
		loadCSUMiDPref();
		
		//レンダリング設定・出力モジュールのリストを取得
		loadRsOmListPref();
		
		//Log : AeStartupDate
		//scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "logAeStartupDate.jsx" );
		
		//Log : CurCsumVersion
		//scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "logCurCsumVersion.jsx" );

		//WF読み込み
		//AE2026: Startupスクリプトのロード順は CSUMCC_Startup.jsx(C=67) → _CSUMCC_wfData.jsx(_=95)
		//        そのため起動時点では workFormat 未設定。scheduleTask で2秒後に遅延実行。
		//        AE2026では scheduleTask内でloadWorkFormatFileが未定義になるが
		//        try-catchで無音化し、_CSUMCC_wfData.jsx がセットしたデータをそのまま使う。
		//        AE2025ではscheduleTask内でloadWorkFormatFileが正常呼び出される。
		if ( adminCSUMCCWfFolder.exists == true )
		{
			//サーバーに接続出来た場合
			wfGlobalSaveDirectory = adminCSUMCCWfFolder;
			saveWfSaveDirectory( "Preferences" , "Work Format Global Save Directory" , wfGlobalSaveDirectory );
		}
		else
		{
			//サーバーに接続出来なかった場合
			loadWfSaveDirectory( "Preferences" , "Work Format Global Save Directory" );
		}
		app.scheduleTask( "try{loadWorkFormatFile(wfGlobalSaveDirectory);}catch(e){}", 2000, false );
		
		

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
			for ( i = 0; wfGlobalSaveDirectory == null; i++ )
			{
				if ( adminCSUMCCWfFolder.exists )
				{  wfGlobalSaveDirectory = adminCSUMCCWfFolder.selectDlg("WorkFormatDirectory...");  }
				else
				{ wfGlobalSaveDirectory = Folder.selectDialog("WorkFormatDirectory..."); }
			}
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
//		WorkFormatファイル読み込み
		function loadWorkFormatFile( targetFolder )
{
		//AE2026: 既存workFormatを退避（scheduleTask再実行時・_CSUMCC_wfData.jsxデータ保護用）
		var savedWorkFormat = ( typeof workFormat !== "undefined" && workFormat.length > 0 ) ? workFormat.slice() : null;
		workFormat = [];
		var removeFileList = [];
		if ( targetFolder.name == "CSUMCC_workFormat" )
		{
			wokFileList = targetFolder.getFiles();
			for ( i = 0; i < wokFileList.length; i++ )
			{
			if ( wokFileList[i].hidden != true && wokFileList[i].name.indexOf (".txt", 0) > -1 )//AE2026: eof(未開封でfalseに変更)を除去、.txt拡張子でフォルダ除外
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
				else
				{
					removeFileList.push (wokFileList[i]);
				}
			}
		
			//不要なファイルを削除
			for ( i = 0; i < removeFileList.length; i++ )
			{
				if ( removeFileList[i] instanceof Folder ) { removeFolderRecursive( removeFileList[i] ); }
				else { removeFileList[i].remove(); }
			}

			//サーバーのWFフォルダにアクセス出来たら、ローカルにコピーをする
			//AE2026: cp-RはDropbox xattrをコピーするため、毎回削除してからコピー → xattr剥がし
			//AE2026: コピー先を CSUMCC/(Cache)/ に変更（(myCSUM_Pref)/は startup context で読み取り不可）
			var wfCacheDir = new Folder(myCSUMCCCacheFolder.fsName+"/CSUMCC_workFormat");
			if ( wfCacheDir.exists ) removeFolderRecursive( wfCacheDir );
			copyFolderRecursive( targetFolder, myCSUMCCCacheFolder );
			wfLocalSaveDirectory = new Folder(myCSUMCCCacheFolder.fsName+"/"+"CSUMCC_workFormat");
			if ( !isWin ) system.callSystem("xattr -dr com.dropbox.attrs '"+wfLocalSaveDirectory.fsName+"'");
			//AE2026: .txtが読めない場合の保険として.jsxにリネーム
			var txtFileList = wfLocalSaveDirectory.getFiles("*.txt");
			for ( var ti = 0; ti < txtFileList.length; ti++ ) { txtFileList[ti].rename( txtFileList[ti].name.replace(/\.txt$/, ".jsx") ); }
		}
	
		if (workFormat.length == 0 )
		{
			//AE2026: スタートアップコンテキストでDropboxファイルread()が空になる問題への対応
			//サーバー読み込み失敗はサイレントフォールバック。ローカルコピーも失敗した場合のみアラート。
			if ( wfLocalSaveDirectory.exists == true )
			{
				saveWfSaveDirectory( "Preferences" , "Work Format Global Save Directory" , wfLocalSaveDirectory );
				wokFileList = wfLocalSaveDirectory.getFiles();
				for ( i = 0; i < wokFileList.length; i++ )
				{
					if ( wokFileList[i].hidden != true && wokFileList[i].name.indexOf(".jsx", 0) > -1 )//AE2026: ローカルキャッシュは.txtを.jsxにリネーム済み
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
				if ( workFormat.length == 0 )
				{
					//AE2026: _CSUMCC_wfData.jsxでセット済みのデータを復元。なければアラート
					if ( savedWorkFormat !== null )
					{ workFormat = savedWorkFormat; }
					else
					{
						alert("WorkFormatファイルが正しく読み込まれませんでした。適切なフォルダを選択して下さい。");
						scriptExecute( myCSUMCCUtilityFolder.fsName + "/" + "Preferences.jsx" )
					}
				}
			}
			else
			{
				//AE2026: _CSUMCC_wfData.jsxでセット済みのデータを復元。なければアラート
				if ( savedWorkFormat !== null )
				{ workFormat = savedWorkFormat; }
				else
				{
					alert("WorkFormatファイルが見つかりません。適切なフォルダを選択して下さい。");
					scriptExecute( myCSUMCCUtilityFolder.fsName + "/" + "Preferences.jsx" )
				}
			}
		}
		return workFormat;
}

// **** FUNCTION ******************************************************************************************************************
//		フォルダを再帰削除（Mac/Win両対応）
		function removeFolderRecursive( folder )
{
		var items = folder.getFiles();
		for ( var i = 0; i < items.length; i++ )
		{
			if ( items[i] instanceof Folder ) { removeFolderRecursive( items[i] ); }
			else { items[i].remove(); }
		}
		folder.remove();
}
// **** FUNCTION ******************************************************************************************************************
//		フォルダを再帰コピー（Mac/Win両対応）
		function copyFolderRecursive( srcFolder, dstParent )
{
		var dstFolder = new Folder( dstParent.fsName + "/" + srcFolder.name );
		if ( !dstFolder.exists ) dstFolder.create();
		var items = srcFolder.getFiles();
		for ( var i = 0; i < items.length; i++ )
		{
			if ( items[i] instanceof Folder ) { copyFolderRecursive( items[i], dstFolder ); }
			else { items[i].copy( dstFolder.fsName + "/" + items[i].name ); }
		}
}
// **** FUNCTION ******************************************************************************************************************
//		CSUMiDPrefファイル読み込み
		function loadCSUMiDPref()
{
		CSUMiDPref = new File(myCSUMPreferenceFolder.fsName + "/" + "_CSUMiD_Pref.txt");//ローカルCSUMiD設定ファイル

		if ( !CSUMiDPref.open("r") )
		{ scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "CSUMiD.jsx" ); }
		else
		{
			csumiD = CSUMiDPref.read();
			csumiDName = csumiD.split(TAB)[0];//CSUMiD名
			csumiDKSei = csumiD.split(TAB)[1];//姓
			csumiDKMei = csumiD.split(TAB)[2];//名
			csumiDFSei = csumiD.split(TAB)[3];//姓フリガナ
			csumiDFMei = csumiD.split(TAB)[4];//名フリガナ
			csumiDGender = csumiD.split(TAB)[5];//性別
			csumiDBdY = csumiD.split(TAB)[6];//誕生日・年
			csumiDBdM = csumiD.split(TAB)[7];//誕生日・月
			csumiDBdD = csumiD.split(TAB)[8];//誕生日・日
			csumiDEmail = csumiD.split(TAB)[9];//メールアドレス
			CSUMiDPref.close();
		}
}
// **** FUNCTION ******************************************************************************************************************
//		レンダリング設定・出力モジュールのリストを取得
		function loadRsOmListPref()
{
		RsOmListPref = new File(myCSUMPreferenceFolder.fsName + "/" + "_RsOmList_Pref.txt");//レンダリング設定・出力モジュールのリストファイル

		scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getRsOmList.jsx" );
		
		//初期設定が済んだら開放
		/*
		if ( !RsOmListPref.open("r") )
		{ scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getRsOmList.jsx" ); }
		else
		{
			RsOmList = RsOmListPref.read();
			wfRsTempList = RsOmList.split(LR)[0].split(",");
			RsTempList = RsOmList.split(LR)[0].split(",");
			RsTempList.shift();
			wfOmTempList = RsOmList.split(LR)[1].split(",");
			OmTempList = RsOmList.split(LR)[1].split(",");
			OmTempList.shift();
			RsOmListPref.close();
		}
		*/

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