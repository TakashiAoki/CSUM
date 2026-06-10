// ============================================
// Script Name : CmdRender
// Version     : v2.3
// 仕様        : aerenderでレンダーキューをバックグラウンドレンダリング（Mac/Win対応）
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-05-24
// ============================================

var curScriptName = "CmdRender";
endFlag = null;

// **** Main Script ****
ProjectCheck();
if ( !endFlag ) RenderQueueCheck();
if ( !endFlag && rqFlag != 0 ) CommandSetUp();

// **** FUNCTION ****
function ProjectCheck() {
	if ( app.project.file == null ) { endFlag = true; alert("プロジェクトを保存して、レンダーキューを設定して下さい"); }
}

function RenderQueueCheck() {
	var rq = app.project.renderQueue;
	rqFlag = 0;
	expMovList = [];
	var missingDirList = [];
	if ( rq.numItems > 0 ) {
		for ( var i = 1; i <= rq.numItems; i++ ) {
			if ( rq.item(i).status == RQItemStatus.QUEUED && rq.item(i).numOutputModules > 0 ) {
				for ( var j = 1; j <= rq.item(i).numOutputModules; j++ ) {
					if ( rq.item(i).outputModule(j).file != null ) {
						var outFile = rq.item(i).outputModule(j).file;
						// 出力先フォルダの存在確認
						if ( !outFile.parent.exists ) {
							missingDirList.push( outFile.parent.fsName );
						}
						if ( outFile.name.match(/.mov$/i) ) {
							rqFlag = -1;
							expMovList.push( outFile );
						} else {
							rqFlag++;
						}
					}
				}
			}
		}
	}
	if ( missingDirList.length > 0 ) {
		endFlag = true;
		alert( "出力先フォルダが存在しません:\n" + missingDirList.join("\n") );
	}
}

function CommandSetUp() {
	// AEP名の ( ) と半角スペースをアンダースコアに置換してコマンドファイル名をサニタイズ
	var safeName = app.project.file.name.split(".aep")[0]
		.replace(/[\s()]/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_+|_+$/, "");
	if ( safeName == "" ) safeName = "Project";

	var cmdExt = isWin ? ".bat" : ".command";
	var expMovFlag = false;

	if ( rqFlag < 0 ) {
		var addName = "_expMov";
		var cacheFolderFileList = myCSUMCCCacheFolder.getFiles();
		for ( var i = 0; i < cacheFolderFileList.length; i++ ) {
			if ( cacheFolderFileList[i].name.indexOf( safeName + "_expMov", 0 ) >= 0 ) {
				expMovFlag = true;
				endFlag = true;
				alert("既に同じ名前のムービーファイルをレンダリングするキューが実行中です");
				break;
			}
		}
	} else {
		var addName = "_expSeq";
	}

	if ( !endFlag && !expMovFlag ) {
		var curCmdFile = new File( myCSUMCCCacheFolder.fsName + "/" + safeName + addName + cmdExt );
		for ( var x = 2; curCmdFile.exists; x++ ) {
			curCmdFile = new File( myCSUMCCCacheFolder.fsName + "/" + safeName + addName + "_v" + x + cmdExt );
		}

		var notifyMsg = expMovList.length == 1 ? expMovList[0].name : expMovList.length + " files rendered";
		var cmd = "";

		if ( isWin ) {
			// ---- Windows: .bat（Python TUI プログレス。Mac分岐と同形） ----
			// Win: Folder.appPackage は "Support Files"（AfterFX.exe/aerender.exe と同階層）。
			//      Mac は .app バンドルのため親階層を見る（下の Mac 分岐参照）。Win は .parent 不要。
			var aerender   = new File( Folder.appPackage.fsName + "/aerender.exe" );
			var progressPy = new File( myCSUMCCResourceFolder.fsName + "/command/aerender_progress.py" );
			var NL = "\r\n";
			var aerenderPath   = aerender.fsName.replace(/\//g, "\\");
			var projectPath    = app.project.file.fsName.replace(/\//g, "\\");
			var cmdFilePath    = curCmdFile.fsName.replace(/\//g, "\\");
			var progressPyPath = progressPy.fsName.replace(/\//g, "\\");

			// --open 引数（Python側で Open Y/N 確認）: 出力フォルダ＋mov（6本未満のみ）
			var openArgs = "";
			if ( rqFlag < 0 && expMovList.length < 6 ) {
				openArgs += " --open \"" + expMovList[0].parent.fsName.replace(/\//g, "\\") + "\"";
				for ( var i = 0; i < expMovList.length; i++ ) {
					openArgs += " --open \"" + expMovList[i].fsName.replace(/\//g, "\\") + "\"";
				}
			}

			// 注意: progressPyPath は "(Resource)" を含む。cmd の if(...)ブロック内に ")" を含む
			//       パスを置くとブロックが途中で閉じて壊れる（即終了の原因）。goto ラベルで分岐する。
			cmd += "@echo off" + NL;
			cmd += "chcp 65001 >nul" + NL;                       // UTF-8（Unicode TUI 用・Python側もUTF-8化）
			// Python 検出順: 実体インストール優先（PATH先頭の Microsoft Store スタブ python.exe を避ける）。
			//   1) %LOCALAPPDATA%\Programs\Python\Python3*（winget ユーザー導入） 2) %ProgramFiles%\Python3*（システム）
			//   3) py ランチャー  4) 最後の手段で PATH の python（Storeスタブの可能性あり）
			cmd += "set \"PY=\"" + NL;
			cmd += "if not defined PY for /d %%D in (\"%LOCALAPPDATA%\\Programs\\Python\\Python3*\") do if exist \"%%D\\python.exe\" set \"PY=%%D\\python.exe\"" + NL;
			cmd += "if not defined PY for /d %%D in (\"%ProgramFiles%\\Python3*\") do if exist \"%%D\\python.exe\" set \"PY=%%D\\python.exe\"" + NL;
			cmd += "if not defined PY where py >nul 2>&1 && set \"PY=py\"" + NL;
			cmd += "if not defined PY for %%P in (python.exe) do set \"PY=%%~$PATH:P\"" + NL;
			cmd += "if defined PY goto CSUM_PY" + NL;
			cmd += "goto CSUM_FALLBACK" + NL;
			// Python TUI（プログレス＋COMPLETEアート＋Open Y/N 確認）
			cmd += ":CSUM_PY" + NL;
			cmd += "\"%PY%\" \"" + progressPyPath + "\"" + openArgs + " \"" + aerenderPath + "\" -sound OFF -continueOnMissingFootage -project \"" + projectPath + "\"" + NL;
			cmd += "goto CSUM_END" + NL;
			// フォールバック: Python未検出時は直接 aerender（バルーン無し）＋出力open
			cmd += ":CSUM_FALLBACK" + NL;
			cmd += "\"" + aerenderPath + "\" -sound OFF -continueOnMissingFootage -project \"" + projectPath + "\"" + NL;
			if ( rqFlag < 0 && expMovList.length < 6 ) {
				cmd += "explorer \"" + expMovList[0].parent.fsName.replace(/\//g, "\\") + "\"" + NL;
				for ( var i = 0; i < expMovList.length; i++ ) {
					cmd += "start \"\" \"" + expMovList[i].fsName.replace(/\//g, "\\") + "\"" + NL;
				}
			}
			cmd += ":CSUM_END" + NL;
			cmd += "del \"" + cmdFilePath + "\"" + NL;            // 自己削除は最終行（実行中の行ズレ回避）

		} else {
			// ---- Mac: .command ----
			var aerender   = new File( Folder.appPackage.parent.fsName + "/aerender" );
			var progressPy = new File( myCSUMCCResourceFolder.fsName + "/command/aerender_progress.py" );
			var NL = "\n";

			// --open 引数（Python 側で Open Y/N 確認）とフォールバック用 open コマンドを構築
			var openArgs = "";
			var openCmds = "";
			if ( rqFlag < 0 && expMovList.length < 6 ) {
				openArgs += " --open '" + expMovList[0].parent.fsName + "'";
				for ( var i = 0; i < expMovList.length; i++ ) {
					openArgs += " --open '" + expMovList[i].fsName + "'";
				}
				openCmds += "    open '" + expMovList[0].parent.fsName + "'" + NL;
				for ( var i = 0; i < expMovList.length; i++ ) {
					openCmds += "    open -a 'QuickTime Player' '" + expMovList[i].fsName + "'" + NL;
				}
			}
			var notifyOK  = "    osascript -e 'display notification \"" + notifyMsg + "\" with title \"CSUMCC\" subtitle \"Render Complete\"'" + NL;
			var notifyErr = "    osascript -e 'display notification \"Render Failed (code: '$RESULT')\" with title \"CSUMCC\" subtitle \"[Error]\"'" + NL;
			var rmCmd     = "  rm '" + curCmdFile.fsName + "'" + NL;

			cmd += "AERENDER='" + aerender.fsName + "'" + NL;
			cmd += "PROGRESS_PY='" + progressPy.fsName + "'" + NL;
			// Python プログレス TUI パス（Open Y/N 確認あり）
			cmd += "if command -v python3 >/dev/null 2>&1 && [ -f \"$PROGRESS_PY\" ]; then" + NL;
			cmd += "  python3 \"$PROGRESS_PY\"" + openArgs + " \"$AERENDER\" -sound OFF -continueOnMissingFootage -project '" + app.project.file.fsName + "'" + NL;
			cmd += "  RESULT=$?" + NL;
			cmd += rmCmd;
			cmd += "  if [ $RESULT -eq 0 ]; then" + NL;
			cmd += notifyOK;
			cmd += "  else" + NL;
			cmd += notifyErr;
			cmd += "  fi" + NL;
			// フォールバック: aerender 直接呼び出し（open は自動実行）
			cmd += "else" + NL;
			cmd += "  \"$AERENDER\" -sound OFF -continueOnMissingFootage -project '" + app.project.file.fsName + "'" + NL;
			cmd += "  RESULT=$?" + NL;
			cmd += rmCmd;
			cmd += "  if [ $RESULT -eq 0 ]; then" + NL;
			cmd += notifyOK;
			if ( rqFlag < 0 && expMovList.length < 6 ) {
				cmd += openCmds;
			}
			cmd += "  else" + NL;
			cmd += notifyErr;
			cmd += "  fi" + NL;
			cmd += "fi" + NL;
		}

		curCmdFile.open("w");
		curCmdFile.encoding = isWin ? "CP932" : "UTF-8";
		curCmdFile.lineFeed = isWin ? "Windows" : "Unix";
		curCmdFile.write(cmd);
		curCmdFile.close();

		if ( !isWin ) {
			system.callSystem("cd '" + myCSUMCCCacheFolder.fsName + "'; chmod u+x '" + curCmdFile.name + "'");
		}

		app.project.save( app.project.file );
		File(curCmdFile).execute();
	}
}

function scriptExecute( scriptFilePath ) {
	var scriptFileName = new File( scriptFilePath );
	scriptFileName.open();
	eval(scriptFileName.read());
	scriptFileName.close();
}
