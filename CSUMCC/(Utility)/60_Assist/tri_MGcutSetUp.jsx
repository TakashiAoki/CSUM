// TriMGcutSetUp Ver.1.01
// Copyright (c) 2007-2023 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2023/01/02
// トライガン MGカット Setup用

var curScriptName = "TriMGcutSetUp";

// **** Main Script ***************************************************************************************************************
app.beginUndoGroup( curScriptName );

var activeItem = app.project.activeItem;
if ( activeItem != null && activeItem instanceof CompItem )
{
    var curCompNameSplit = activeItem.name.split("_");
    if ( curCompNameSplit[0] == "TRI" )
    {
        // 選択コンポの末尾を「_mg_v1」に
        activeItem.name = curCompNameSplit[0] + "_" + curCompNameSplit[1] + "_" + curCompNameSplit[2] + "_mg_v1";

        // ボールドテイクを「mg_v1」に
        n = activeItem.numLayers;
        ac = 1;
        for ( i = 1; i <= n; i++ )
        {
            var curLayer = activeItem.layer(i);
            
            if ( curLayer instanceof ShapeLayer && curLayer.name == "memo +作業者名" )
            {
                curLayer.enabled = false;
            }
            if ( curLayer instanceof TextLayer && curLayer.name == "TAKE(自動)" )
            {
                curLayer.Text.property("ADBE Text Document").expression =
                    "var n = thisComp.name.split(" +"\""+ "_" +"\""+ ");" +CR+
                    "n[3]+" +"\""+ "_" +"\""+ "+n[4];";//Source Text
            }
        }
        // 作業者名を「Over Ray Studio_Aoki」に
        var curTextLayer = activeItem.layers.addText("Over Ray Studio_Aoki");
        curTextLayer.outPoint = 8/24;
        curTextLayer.moveBefore(activeItem.layer(7));
        curTextLayer.property("ADBE Transform Group").property("ADBE Position").setValue( [1200,740,0] );//Position
        var curSourceText = curTextLayer.property("Source Text"); 
        var curTexDoc = curSourceText.value;
        curTexDoc.fontSize = 24;
        curTexDoc.fillColor = [0, 0, 0];
        curTexDoc.strokeWidth = 0;
        curTexDoc.font = "Helvetica";
        curTexDoc.justification = ParagraphJustification.LEFT_JUSTIFY;
        curSourceText.setValue(curTexDoc);

        //プロジェクトを保存
        curProjectFile = app.project.file;
        curCutFolder = new Folder(curProjectFile.parent.path);
        curAepFolder = new Folder(curCutFolder.path + "/AEP");
        var newProjectName = activeItem.name + ".aep"
		var curProjectFile = new File(curAepFolder.fsName+"/"+newProjectName);
		app.project.save(curProjectFile);
    }
}
app.endUndoGroup();